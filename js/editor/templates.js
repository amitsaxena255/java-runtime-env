import { setFileContent, getFileNames, createFile, setActiveFile } from './fileSystem.js';

export const TEMPLATES = {
    'Hello Java': `public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, Java World!");
    }
}`,

    'Map & Set Iterator': `import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;

public class Solution {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("Apple", 10);
        map.put("Banana", 20);
        map.put("Cherry", 30);

        System.out.println("Iterating over entry set:");
        Iterator<Map.Entry<String, Integer>> it = map.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Integer> entry = it.next();
            System.out.println(entry.getKey() + " -> " + entry.getValue());
        }
    }
}`,

    'Fibonacci (DP)': `public class Solution {
    public static void main(String[] args) {
        int n = 10;
        System.out.println("Fibonacci of " + n + " is: " + fib(n));
    }

    public static int fib(int n) {
        if (n <= 1) return n;
        int[] dp = new int[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i-1] + dp[i-2];
        }
        return dp[n];
    }
}`,

    'Binary Tree DFS': `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) {
        this.val = val;
    }
}

public class Solution {
    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.left = new TreeNode(4);
        
        System.out.print("Inorder DFS Traversal: ");
        dfs(root);
        System.out.println();
    }

    public static void dfs(TreeNode root) {
        if (root == null) return;
        dfs(root.left);
        System.out.print(root.val + " ");
        dfs(root.right);
    }
}`
};

export function loadTemplate(templateName) {
    if (!TEMPLATES[templateName]) return false;
    
    // Switch to or create templates in Solution.java
    const content = TEMPLATES[templateName];
    if (getFileNames().includes('Solution.java')) {
        setFileContent('Solution.java', content);
        setActiveFile('Solution.java');
    } else {
        createFile('Solution.java', content);
    }
    return true;
}
