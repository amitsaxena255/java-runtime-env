# Java Runtime Environment - Browser-Based IDE

A fully functional in-browser Java IDE for practicing Java coding. Write, compile, and run Java programs directly in your browser with no backend required.

## Features

- ✨ **In-Browser Java Execution** - No server needed, runs locally in your browser
- 📁 **Multi-File Workspace** - Create, rename, delete, and switch between multiple `.java` files
- 🐞 **Step-Through Debugger** - Pause, step over, resume, and terminate execution with line highlighting
- 🏆 **Coding Challenges** - Integrated Leetcode-style challenges with automated testing verification
- 🧩 **Code Snippets** - Inject common algorithms (Binary Search, Bubble Sort, BFS) in one click
- 📝 **Code Editor** - Full Monaco Editor setup with custom keybindings and syntax highlighting
- ⚡ **Auto-Imports** - Automatically resolves and prepends Java imports on save/run
- 💾 **Code Persistence** - Automatic workspace backups to localStorage


## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Editor**: Monaco Editor (used by VS Code)
- **Architecture**: Fully client-side, no backend required
- **Runtime**: Custom JavaScript transpiler for Java code

## Getting Started

### Option 1: Direct Browser Usage
1. Clone the repository:
   ```bash
   git clone https://github.com/amitsaxena255/java-runtime-env.git
   cd java-runtime-env
   ```

2. Open `index.html` directly in your browser (the simplest way)

### Option 2: Local Server (Recommended)
1. Clone and navigate to the directory (as above)

2. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js
   npx serve
   ```

3. Open your browser and go to `http://localhost:8000`

## Project Structure

```
java-runtime-env/
├── index.html          # Main IDE interface
├── css/
│   └── style.css       # Styling and themes
├── js/
│   └── app.js          # Main application logic
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## Usage Guide

### Writing Code
1. The IDE loads with a default "Hello, Java" template
2. Write your Java code in the left panel
3. Your code is automatically saved to browser's local storage

### Running Code
1. Click the **▶ Run Code** button, or
2. Press **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac)

### Managing Output
- **Clear Output**: Click the 🗑 button to clear all output
- **Reset Template**: Click the ↻ button to revert to the default template

## Code Template

The default template structure:

```java
public class Solution {
    public static void main(String[] args) {
        solve();
    }
    
    static void solve() {
        // Write your code here
        System.out.println("Hello, Java!");
    }
}
```

### Tips for Coding
- Always keep the class name as `Solution`
- Write your main logic in the `solve()` method
- Use `System.out.println()` to print output
- You can create additional static methods and call them from `solve()`

## Example Programs

### Print Numbers 1-10
```java
public class Solution {
    public static void main(String[] args) {
        solve();
    }
    
    static void solve() {
        for (int i = 1; i <= 10; i++) {
            System.out.println(i);
        }
    }
}
```

### Calculate Factorial
```java
public class Solution {
    public static void main(String[] args) {
        solve();
    }
    
    static void solve() {
        int n = 5;
        System.out.println("Factorial of " + n + " is " + factorial(n));
    }
    
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
}
```

### String Manipulation
```java
public class Solution {
    public static void main(String[] args) {
        solve();
    }
    
    static void solve() {
        String text = "Hello, World!";
        System.out.println("Original: " + text);
        System.out.println("Uppercase: " + text.toUpperCase());
        System.out.println("Length: " + text.length());
    }
}
```

## Supported Java Features

### ✅ Supported
- Basic data types (int, String, double, boolean, etc.)
- Variables and operators
- Control flow (if/else, switch, for, while, do-while)
- Methods and recursion
- Arrays and basic array operations
- String operations
- System.out.println() for output
- Comments (// and /* */)
- Basic object-oriented features
- **Collections**: Full support for `ArrayList`, `HashMap`, `HashSet` (including `Iterator`, `keySet()`, `values()`, `entrySet()`, `Map.Entry`, and enhanced `for` loops)
- **Auto-Imports**: Automatically detects used utility classes and prepends the standard `import` statements at the top of the editor
- **Arrays Utility**: Polyfill support for `Arrays.sort()`, `Arrays.toString()`, `Arrays.fill()`, and `Arrays.equals()`
- **Missing Main Validation**: Structural analysis to check if code lacking a `main` method is syntactically correct

### ⚠️ Limited Support
- Custom classes and objects
- Inheritance and interfaces

### ❌ Not Supported
- File I/O operations (security restriction)
- Network operations
- Multi-threading
- External/third-party libraries
- Database connections

## Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Opera 76+ ✅

## Performance Tips

1. **Keep programs simple** - Complex code may run slower in the browser
2. **Avoid infinite loops** - Your browser may freeze
3. **Use efficient algorithms** - The transpiler is not as fast as native Java

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Run Code |
| `Ctrl+/` | Toggle Comment |
| `Ctrl+Shift+K` | Delete Line |
| `Alt+Up` / `Alt+Down` | Move Line Up/Down |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

## Troubleshooting

### "Invalid Java code structure" error
- Ensure you have a `public class` with a `main` method
- The class name must be `Solution`
- Check for syntax errors

### Code not running
- Check the browser console for error messages (F12)
- Verify the code follows the template structure
- Try the "Reset Template" button

### Output not appearing
- Make sure you're using `System.out.println()` to print
- Check that there are no runtime errors (shown in error panel)

## Limitations

1. **Standard Libraries** - Supports common utility collections (`HashMap`, `HashSet`, `ArrayList`, `Arrays`, `Collections`, `Iterator`, etc.) but other packages are not polyfilled.
2. **No file I/O** - Cannot read/write files for security
3. **No network access** - Cannot make HTTP requests
4. **Single-threaded** - No concurrent programming support
5. **External Imports** - Third-party libraries/dependencies are not supported.

## Future Enhancements

- [x] Add support for more Java collections
- [x] Implement debugging features (breakpoints, step-through)
- [x] Add code snippets library
- [x] Support multiple files
- [x] Add dark/light theme toggle
- [x] Implement code formatting
- [x] Add more example templates
- [x] Create a problem/challenge system

## Contributing

Contributions are welcome! Please feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

MIT License - feel free to use this for learning and practicing Java!

## Author

Created by [amitsaxena255](https://github.com/amitsaxena255)

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Coding! 🚀**