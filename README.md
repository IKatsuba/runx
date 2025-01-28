# runx 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ATTENTION! The project is under development and not ready for production use!

A lightning monorepo task runner written in Deno. `runx` helps you manage and
execute tasks across multiple packages in your monorepo with minimal
configuration and maximum efficiency.

> **Note**: Supports only npm workspaces for now. Other package managers are
> planned.

## 🌟 Key Features

- **Zero Configuration**: Works out of the box with your existing monorepo
  structure
- **Smart Workspace Detection**: Automatically detects and works with workspace
  patterns defined in your root `package.json`
- **Intelligent Dependency Management**:
  - Builds and validates dependency relationships between packages
  - Detects and prevents circular dependencies
  - Executes tasks in correct topological order
- **Flexible Execution Modes**:
  - Run commands across all packages
  - Target specific packages
  - Execute only in affected packages (Git-aware)

## 🗺️ Roadmap

Current status of essential monorepo features:

✅ **Dependency Management**

- Smart dependency graph building
- Circular dependency detection
- Proper topological ordering

✅ **Change Impact Analysis**

- Git-aware change detection
- Affected package detection with dependents

✅ **Modularity and Isolation**

- Workspace pattern support
- Package-level script execution
- Independent package management

🚧 **Parallel Task Execution**

- Topologically ordered execution
- Proper dependency order respect

🚧 **Incremental Builds**

- Smart rebuilding of changed packages
- Dependency-aware build process

🚧 **Build Caching**

- Cache build artifacts
- Reuse previous builds when possible

🚧 **Versioning and Release Management**

- Automated version bumping
- Changelog generation
- Release coordination

🚧 **Unified Tools and Processes**

- Standardized build process
- Consistent development environment
- Shared configurations

🚧 **Scalability**

- Large repository support
- Performance optimizations
- Resource management

🚧 **Access Control and Permissions**

- Package-level access control
- Security policies
- Role-based permissions

## 📦 Installation

```bash
deno install --allow-read --allow-env --allow-run -g -N -R -n runx jsr:@runx/cli
```

## 🚀 Quick Start

1. Navigate to your monorepo root:

```bash
cd your-monorepo
```

2. Run a script in all packages:

```bash
runx test
```

## 💡 Usage

### Basic Commands

```bash
# Run a command in all packages
runx <task-name>

# Run a command only in specific packages
runx <task-name> package1 package2

# Run a command only in affected packages (compared to main branch)
runx <task-name> --affected

# Run a command in packages affected since a specific branch
runx <task-name> --affected feature-branch
```

### Command Options

- `-a, --affected [base]` - Run command only for affected packages since the
  specified base branch (defaults to 'main')
- `--version` - Show version information
- `-h, --help` - Display help information

## 🔧 How It Works

1. **Workspace Detection**: `runx` reads your root `package.json` to understand
   your workspace structure
2. **Dependency Analysis**: Builds a complete dependency graph of your packages
3. **Task Execution**:
   - Validates the dependency graph for circular dependencies
   - Determines the correct execution order
   - Executes tasks while maintaining proper working directories and environment
     variables

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major
changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

Built with:

- [Deno](https://deno.land/) - A modern runtime for JavaScript and TypeScript
- [Cliffy](https://cliffy.io/) - A framework for building command line
  applications
- [dax](https://github.com/dsherret/dax) - The friendly shell scripting library
  for Deno
