# Development Roadmap

## Current Status: v1.0 - Core Features Complete ✅

The bot currently includes:
- ✅ Slash command system with TypeScript
- ✅ Lavalink v4 integration with Shoukaku
- ✅ Multi-source audio support (YouTube, Spotify, Deezer, etc.)
- ✅ Basic music commands (play, pause, resume, stop, skip, volume, nowplaying)
- ✅ Docker deployment setup
- ✅ Animated README with SVG graphics

---

## v2.0 - Server Moderation Features 🚧

**Status**: Planning Phase
**Timeline**: 4 weeks
**Priority**: High

### Features

#### Phase 1: Foundation (Week 1)
- [ ] SQLite database integration
- [ ] Server configuration system
- [ ] Permission middleware
- [ ] Basic settings command

#### Phase 2: DJ & Voting (Week 1-2)
- [ ] DJ role system
- [ ] Vote skip functionality
- [ ] Force skip (admin command)
- [ ] Permission-based command restrictions

#### Phase 3: Advanced Controls (Week 2-3)
- [ ] Admin commands (forceskip, forcestop, clearqueue)
- [ ] Queue management (remove, move, shuffle)
- [ ] Channel whitelist/blacklist
- [ ] Volume and duration limits

#### Phase 4: User Management (Week 3)
- [ ] Command cooldowns
- [ ] User restriction system
- [ ] Enhanced queue display with pagination
- [ ] Settings management interface

#### Phase 5: Polish & Deploy (Week 4)
- [ ] Comprehensive testing
- [ ] Documentation updates
- [ ] Admin setup guide
- [ ] Migration guide from v1.0

### Documentation
See [MODERATION_PLAN.md](./MODERATION_PLAN.md) for detailed specifications.

---

## v2.5 - Quality of Life Improvements

**Status**: Planned
**Timeline**: 2 weeks
**Priority**: Medium

### Features
- [ ] Playlist system (save/load playlists)
- [ ] Search with autocomplete
- [ ] Lyrics command
- [ ] Now playing rich embeds with progress bar
- [ ] Loop command (track/queue)
- [ ] Seek command
- [ ] Filter commands (bassboost, nightcore, etc.)
- [ ] Favorites system per user

---

## v3.0 - Advanced Features

**Status**: Planned
**Timeline**: 6-8 weeks
**Priority**: Low

### Features
- [ ] Web dashboard for configuration
- [ ] Playlist sharing between servers
- [ ] Auto-playlist (radio mode)
- [ ] Music recommendations
- [ ] Statistics and analytics
- [ ] Audit logs for moderation actions
- [ ] Premium tier system
- [ ] Multi-language support
- [ ] Scheduled playback
- [ ] Integration with last.fm/Spotify profiles

---

## v4.0 - Scalability & Performance

**Status**: Concept
**Timeline**: TBD
**Priority**: Future

### Features
- [ ] PostgreSQL support for large deployments
- [ ] Redis caching layer
- [ ] Sharding support for 1000+ servers
- [ ] Load balancing across multiple Lavalink nodes
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Plugin system for custom commands

---

## Community Requests

Track feature requests and voting:
- [ ] TBD (Waiting for community feedback)

---

## Version History

### v1.0.0 (Current)
**Released**: 2024-12-19

- Initial release with core music functionality
- Slash commands only (no legacy prefix)
- Lavalink v4 with LavaSrc
- Docker Compose deployment
- TypeScript with strict typing
- Animated SVG documentation

---

## Contributing

Want to help build these features? Check out:
1. [MODERATION_PLAN.md](./MODERATION_PLAN.md) - Current development focus
2. [GitHub Issues](https://github.com/lxrdxe7o/mikeneko/issues) - Bug reports and requests
3. [Contributing Guide](./CONTRIBUTING.md) - How to contribute (coming soon)

---

**Last Updated**: 2024-12-19
