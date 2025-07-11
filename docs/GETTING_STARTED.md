# AI-Agency Mono-Repo – Quick Start

## 1. **Clone & open in Cursor**

```bash
gh repo clone tbwa/ai-agency
cd ai-agency
```

## 2. **Spin up dev-container**

Cursor will prompt automatically; otherwise:

```bash
devcontainer open .
```

## 3. **Boot the stack**

```bash
task dev
```

## 4. **Smoke test**

```bash
task doctor
```

## 5. **Pulser dashboard**

http://localhost:3000/pulser

## 6. **Available Services**

### CES Pilot

- Frontend: http://localhost:3001
- Backend API: http://localhost:8001

### Scout Pilot

- Frontend: http://localhost:3002
- Backend API: http://localhost:8002

## 7. **Common Tasks**

```bash
# Run all health checks
task doctor

# Start development servers
task dev

# Monitor Google Drive health
task drive:scan

# Run database migrations
task db:migrate

# Build all components
task build
```

## 8. **Architecture Overview**

See `docs/ARCHITECTURE.md` for detailed system architecture and data flow diagrams.

## 9. **Troubleshooting**

### Development Container Issues

- Ensure Docker is running
- Check devcontainer configuration
- Rebuild container if needed

### Database Connection Issues

- Verify Supabase credentials in `.env.local`
- Check database migrations are up to date
- Run `task db:migrate`

### Service Health Issues

- Run `task doctor` for comprehensive health check
- Check individual service logs
- Verify environment variables

## 10. **Next Steps**

1. Review `docs/ARCHITECTURE.md`
2. Check service health with `task doctor`
3. Explore pilot-specific documentation in `pilots/*/README.md`
4. Configure environment variables per service needs
