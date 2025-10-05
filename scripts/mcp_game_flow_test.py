#!/usr/bin/env python3
"""Automated three-client MCP liar game flow test."""

import random
import string
import time
from collections import OrderedDict
from typing import Any, Dict

import requests

BASE_URL = "http://172.26.180.125:20021/api/v1"


def random_suffix(length: int = 5) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


class Client:
    def __init__(self, label: str, nickname: str) -> None:
        self.label = label
        self.nickname = nickname
        self.session = requests.Session()
        self.user_id: int | None = None
        self.player_id: int | None = None
        self.role: str | None = None
        self.word: str | None = None


clients: "OrderedDict[str, Client]" = OrderedDict()


def log(message: Any) -> None:
    if not isinstance(message, str):
        message = str(message)
    safe = message.encode("cp949", errors="ignore").decode("cp949")
    print(safe, flush=True)


def update_players(state: Dict[str, Any]) -> None:
    for player in state.get("players", []):
        nickname = player.get("nickname")
        for client in clients.values():
            if client.nickname == nickname:
                client.player_id = player.get("id")
                client.user_id = player.get("userId")


def fetch_state(client: Client, game_number: int) -> Dict[str, Any]:
    resp = client.session.get(f"{BASE_URL}/game/{game_number}")
    resp.raise_for_status()
    state = resp.json()
    update_players(state)
    client.role = state.get("yourRole")
    client.word = state.get("yourWord")
    return state


def main() -> None:
    suffix = random_suffix()
    clients.clear()
    clients.update({
        "host": Client("host", f"MCP_Host_{suffix}"),
        "p2": Client("p2", f"MCP_CitizenA_{suffix}"),
        "p3": Client("p3", f"MCP_CitizenB_{suffix}"),
    })

    log(f"[INIT] Using suffix {suffix} for player nicknames")

    log("[STEP] Logging in clients…")
    for client in clients.values():
        resp = client.session.post(
            f"{BASE_URL}/auth/login",
            json={"nickname": client.nickname, "password": ""},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("success"):
            raise RuntimeError(f"Login failed for {client.nickname}: {data}")
        log(f"  - {client.nickname} logged in (userId={data.get('userId')})")

    log("[STEP] Fetching approved subjects…")
    subjects_resp = clients["host"].session.get(f"{BASE_URL}/subjects/listsubj", timeout=10)
    subjects_resp.raise_for_status()
    subjects = subjects_resp.json()

    if not subjects:
        log("  - No approved subjects found; creating a default subject set")
        create_subject_resp = clients["host"].session.post(
            f"{BASE_URL}/subjects/applysubj",
            json={"name": "테스트주제"},
            timeout=10,
        )
        create_subject_resp.raise_for_status()
        subject_id = create_subject_resp.json()["id"]
        for word in ["사과", "바나나", "포도", "딸기", "수박"]:
            word_resp = clients["host"].session.post(
                f"{BASE_URL}/words/applyw",
                json={"subjectId": subject_id, "word": word},
                timeout=10,
            )
            word_resp.raise_for_status()
        subjects_resp = clients["host"].session.get(f"{BASE_URL}/subjects/listsubj", timeout=10)
        subjects_resp.raise_for_status()
        subjects = subjects_resp.json()

    approved_subject_ids = [subj["id"] for subj in subjects][:2]
    if not approved_subject_ids:
        raise RuntimeError("No approved subjects available")
    log(f"  - Selected subject IDs: {approved_subject_ids}")

    log("[STEP] Creating game room as host…")
    create_payload = {
        "nickname": clients["host"].nickname,
        "gameName": f"MCP Integration Test Room {suffix}",
        "gameParticipants": 3,
        "gameTotalRounds": 1,
        "gameLiarCount": 1,
        "gameMode": "LIARS_KNOW",
        "subjectIds": approved_subject_ids,
        "useRandomSubjects": False,
        "targetPoints": 10,
    }
    create_resp = clients["host"].session.post(f"{BASE_URL}/game/create", json=create_payload, timeout=10)
    create_resp.raise_for_status()
    game_number = create_resp.json()
    log(f"  - Game room created with number: {game_number}")

    waiting_state = fetch_state(clients["host"], game_number)
    log(f"  - Waiting room players: {[p.get('nickname') for p in waiting_state.get('players', [])]}")

    log("[STEP] Citizens joining the room…")
    for label in ("p2", "p3"):
        join_payload = {"gameNumber": game_number, "nickname": clients[label].nickname}
        join_resp = clients[label].session.post(f"{BASE_URL}/game/join", json=join_payload, timeout=10)
        join_resp.raise_for_status()
        state = join_resp.json()
        update_players(state)
        log(f"  - {clients[label].nickname} joined; players now {[p.get('nickname') for p in state.get('players', [])]}")

    log("[STEP] Host starting the game…")
    start_resp = clients["host"].session.post(f"{BASE_URL}/game/start", timeout=10)
    start_resp.raise_for_status()
    start_state = start_resp.json()
    update_players(start_state)
    turn_order_names = start_state.get("turnOrder", [])
    current_phase = start_state.get("currentPhase")
    citizen_subject = start_state.get("citizenSubject")
    log(f"  - Game started; phase={current_phase}, turn_order={turn_order_names}, citizen_subject='{citizen_subject}'")

    log("[STEP] Syncing individual player perspectives…")
    for client in clients.values():
        personal_state = fetch_state(client, game_number)
        word_display = personal_state.get("yourWord")
        if isinstance(word_display, str):
            word_display = word_display.encode("cp949", errors="ignore").decode("cp949")
        log(f"    > {client.nickname} role={personal_state.get('yourRole')} word={word_display}")

    liar_client = next((cl for cl in clients.values() if cl.role == "LIAR"), None)
    if liar_client is None:
        raise RuntimeError("Failed to identify liar")
    citizen_clients = [cl for cl in clients.values() if cl is not liar_client]
    citizen_word = next((cl.word for cl in citizen_clients if isinstance(cl.word, str) and cl.word), None)
    if citizen_word is None:
        citizen_word = citizen_subject
    log(f"  - Identified liar: {liar_client.nickname} (userId={liar_client.user_id})")

    nickname_to_client = {cl.nickname: cl for cl in clients.values()}

    log("[STEP] Running hint submissions…")
    for nickname in turn_order_names:
        client = nickname_to_client[nickname]
        hint_payload = {"gameNumber": game_number, "hint": f"힌트 from {nickname}"}
        hint_resp = client.session.post(f"{BASE_URL}/game/hint", json=hint_payload, timeout=10)
        hint_resp.raise_for_status()
        hint_state = hint_resp.json()
        log(f"    > {nickname} submitted hint; phase -> {hint_state.get('currentPhase')}")

    log("[STEP] Conducting first voting phase…")
    for client in citizen_clients:
        vote_payload = {"gameNumber": game_number, "targetUserId": liar_client.user_id}
        vote_resp = client.session.post(f"{BASE_URL}/game/vote", json=vote_payload, timeout=10)
        vote_resp.raise_for_status()
        try:
            vote_state = vote_resp.json()
        except ValueError:
            vote_state = None
        if not isinstance(vote_state, dict):
            vote_state = fetch_state(client, game_number)
        accused_info = vote_state.get("accusedPlayer") or {}
        log(f"    > {client.nickname} voted; phase -> {vote_state.get('currentPhase')} accused={accused_info.get('nickname')}")

    log("[STEP] Liar defense flow…")
    defense_payload = {"gameNumber": game_number, "defenseText": "정말 아닙니다"}
    defense_resp = liar_client.session.post(f"{BASE_URL}/game/submit-defense", json=defense_payload, timeout=10)
    defense_resp.raise_for_status()
    log(f"    > Defense response: {defense_resp.json()}")

    end_defense_resp = liar_client.session.post(
        f"{BASE_URL}/game/defense/end", json={"gameNumber": game_number}, timeout=10
    )
    end_defense_resp.raise_for_status()
    end_defense_state = end_defense_resp.json()
    log(f"    > Defense ended; phase -> {end_defense_state.get('currentPhase')}")

    log("[STEP] Waiting for final voting phase…")
    final_phase_state: Dict[str, Any] | None = None
    for _ in range(10):
        time.sleep(0.8)
        final_phase_state = fetch_state(clients["host"], game_number)
        if final_phase_state.get("currentPhase") == "VOTING_FOR_SURVIVAL":
            log("    > Transition confirmed: VOTING_FOR_SURVIVAL")
            break
    else:
        log("    > Final voting phase not observed; proceeding with manual confirmation")

    log("[STEP] Final voting phase…")
    for client in clients.values():
        final_payload = {"gameNumber": game_number, "voteForExecution": True}
        final_resp = client.session.post(f"{BASE_URL}/game/vote/final", json=final_payload, timeout=10)
        final_resp.raise_for_status()
        try:
            final_state = final_resp.json()
        except ValueError:
            final_state = fetch_state(client, game_number)
        log(f"    > {client.nickname} final vote; phase -> {final_state.get('currentPhase')}")

    log("[STEP] Liar guessing the subject…")
    guess_payload = {"gameNumber": game_number, "guess": citizen_subject or "테스트주제"}
   
    guess_resp = liar_client.session.post(f"{BASE_URL}/game/guess-word", json=guess_payload, timeout=10)
    guess_resp.raise_for_status()
    guess_result = guess_resp.json()
    log(f"    > Guess result: {guess_result}")

    final_state = fetch_state(clients["host"], game_number)
    log(
        f"[RESULT] Final state: state={final_state.get('gameState')} "
        f"phase={final_state.get('currentPhase')} winner={final_state.get('winner')}"
    )

    log("[SUCCESS] Three-client game flow completed successfully.")


if __name__ == "__main__":
    main()
