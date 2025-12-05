# Neople DnF API Documentation

Base URL: `https://api.neople.co.kr/df`
Image Base URL: `https://img-api.neople.co.kr/df`

## 1. Character Search
Search for characters by name across all servers. This is the primary API used to find applicants.

- **Endpoint**: `/servers/all/characters`
- **Method**: `GET`
- **Parameters**:
  - `characterName`: URL Encoded Character Name (Required)
  - `apikey`: Your API Key (Required)
  - `limit`: Number of results (Default 10, Max 200)
  - `wordType`: `match` (exact) or `full` (contains)

### Request Example
```http
GET https://api.neople.co.kr/df/servers/all/characters?characterName=%EC%95%84%EC%B2%98&apikey=YOUR_KEY
```

### Response Example
```json
{
  "rows": [
    {
      "serverId": "cain",
      "characterId": "87c64cb4144379c...",
      "characterName": "인트루더",
      "level": 110,
      "jobId": "afdf3b9...",
      "jobGrowId": "...",
      "jobName": "아처",
      "jobGrowName": "헌터",
      "fame": 58000,
      "adventureName": "모험단이름"
    }
  ]
}
```

## 2. Character Image
Get the character's avatar image.

- **Endpoint**: `/servers/{serverId}/characters/{characterId}`
- **Method**: `GET` (Image Resource)
- **Parameters**:
  - `zoom`: Zoom level (1, 2, 3). Default is 1.

### Request Example
```http
GET https://img-api.neople.co.kr/df/servers/cain/characters/87c64cb4144379c...?zoom=1
```

## 3. Character Basic Info (Optional)
Get details for a specific character ID. Useful for refreshing data without searching.

- **Endpoint**: `/servers/{serverId}/characters/{characterId}`
- **Method**: `GET`
- **Parameters**:
  - `apikey`: Your API Key

### Response Example
Same structure as a single item in the Search `rows` array.

## Implementation Notes
- **Fame (명성)**: Included in the Search response. We will use this to sort/filter.
- **Adventure Name**: We will display this on the character card.
- **Damage/Buff**: Not available in API. Must be manually entered by the user (Source: dundam.xyz).
- **Caching**: We will cache the `rows` data into our `dnf_characters` table to avoid repeated API calls for the same character.
