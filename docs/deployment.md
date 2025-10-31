# Deployment Guide — Nemonemo

## 1. Build Artifacts

### Backend
```bash
./gradlew :nemonemo-api:clean :nemonemo-api:bootJar
```
- Generates `build/libs/nemonemo-api.jar`.
- Configure build profile via `-Pprofile=prod` for production-only beans (metrics, tracing).

### Puzzle Worker
```bash
./gradlew :nemonemo-worker:clean :nemonemo-worker:bootJar
```
- Produces `nemonemo-worker.jar`.

### Frontend
```bash
cd apps/nemonemo
npm install
npm run build
```
- Outputs static bundle under `dist/`. Upload to CDN/S3 with cache headers.

## 2. Runtime Topology

| Service               | Replicas | Notes                                    |
|-----------------------|----------|------------------------------------------|
| API (Spring Boot)     | 3        | Exposed via HTTPS (Ingress/Nginx).       |
| Puzzle Worker         | 2        | Subscribes to Redis Streams queue.       |
| Match-Making Service  | 2        | Stateful via Redis; enable sticky LB.    |
| Postgres              | 1 (HA)   | Managed service (RDS/Aurora) recommended.|
| Redis                 | 1 (cluster) | Use ACL + persistence (AOF).         |
| CDN/Object Storage    | N/A      | Store thumbnails, puzzle previews.       |

## 3. Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_PROFILE` | `prod`, `stage`, or `local`. Controls bean activation. |
| `DATABASE_URL` | PostgreSQL connection string (`jdbc:postgresql://...`). |
| `DATABASE_MAX_POOL` | HikariCP pool size (default 20). |
| `REDIS_URL` | Redis cluster endpoint. |
| `JWT_PUBLIC_KEY` / `JWT_PRIVATE_KEY` | Base64 encoded keypair. |
| `SIGNING_SECRET` | HMAC secret for `anon_id` cookies. |
| `PUZZLE_QUEUE_STREAM` | Redis stream name for worker tasks. |
| `OBJECT_STORAGE_BUCKET` | Bucket name for thumbnails/assets. |
| `OCR_WORKER_ENDPOINT` | Optional external OCR microservice. |

Secrets are injected via Vault/Parameter Store and never committed.

## 4. Docker Compose (local/staging)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nemonemo
      POSTGRES_USER: nemonemo
      POSTGRES_PASSWORD: nemonemo
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "6379:6379"

  api:
    build: ../..
    command: ["java", "-jar", "/app/nemonemo-api.jar"]
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/nemonemo
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  worker:
    build: ../..
    command: ["java", "-jar", "/app/nemonemo-worker.jar"]
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/nemonemo
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  pgdata:
```

Run with `docker compose up --build`.

## 5. Observability

- **Metrics**: Micrometer -> Prometheus. Scrape `/actuator/prometheus`.
- **Tracing**: OpenTelemetry exporter to Jaeger/Tempo.
- **Logging**: JSON logs shipped via Fluent Bit to ELK stack.
- **Alerts**:
  - Redis memory usage > 70%
  - Postgres connections > 80% of pool
  - API p95 latency > 200ms
  - Worker job queue length > 200

## 6. Zero-Downtime Deployment

1. Deploy database migrations (Liquibase/Flyway) in advance.
2. Roll out API pods via rolling update (k8s Deployment) with readiness probes (`/actuator/health/readiness`).
3. Drain WebSocket connections gracefully:
   - Mark pod as `draining` (custom endpoint).
   - Stop accepting new sessions.
   - Wait for active games to complete or hand off to another pod.
4. Deploy worker + match service similarly.
5. Invalidate CDN cache for updated assets (ETag based).

## 7. Disaster Recovery

- Postgres point-in-time recovery enabled (continuous WAL backups).
- Redis persistence (AOF every second). Daily snapshot to object storage.
- Frontend assets redeployable from CI artifacts.
- Run quarterly game day simulating Redis outage and verifying failover plan.
