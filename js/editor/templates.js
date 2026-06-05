import { setCode } from './editor.js';

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
}`,

    'Binary Search': `public class Solution {
    public static void main(String[] args) {
        int[] arr = new int[]{1, 3, 5, 7, 9};
        System.out.println("Search 5: " + binarySearch(arr, 5));
        System.out.println("Search 4: " + binarySearch(arr, 4));
    }

    public static int binarySearch(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        while (left <= right) {
            int mid = (int) (left + (right - left) / 2);
            if (arr[mid] == target) {
                return mid;
            }
            if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1; // not found
    }
}`,

    'Bubble Sort': `import java.util.Arrays;

public class Solution {
    public static void main(String[] args) {
        int[] arr = new int[]{5, 3, 8, 1, 2};
        bubbleSort(arr);
        System.out.println("Sorted: " + Arrays.toString(arr));
    }

    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    // swap
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}`,

    'Reverse Linked List': `public class Solution {
    public static void main(String[] args) {
        ListNode head = new ListNode(1);
        head.next = new ListNode(2);
        head.next.next = new ListNode(3);
        ListNode rev = reverseList(head);
        System.out.println("Reversed: " + rev.val + " -> " + rev.next.val + " -> " + rev.next.next.val);
    }

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int val) { this.val = val; }
    }

    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode current = head;
        while (current != null) {
            ListNode nextTemp = current.next;
            current.next = prev;
            prev = current;
            current = nextTemp;
        }
        return prev;
    }
}`,

    'Graph BFS': `import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;

public class Solution {
    public static void main(String[] args) {
        Map<Integer, List<Integer>> graph = new HashMap<>();
        List<Integer> list1 = new ArrayList<>(); list1.add(2); list1.add(3);
        List<Integer> list2 = new ArrayList<>(); list2.add(4);
        List<Integer> list3 = new ArrayList<>(); list3.add(4);
        List<Integer> list4 = new ArrayList<>();
        graph.put(1, list1);
        graph.put(2, list2);
        graph.put(3, list3);
        graph.put(4, list4);
        bfs(graph, 1);
    }

    public static void bfs(Map<Integer, List<Integer>> graph, int startNode) {
        Set<Integer> visited = new HashSet<>();
        List<Integer> queue = new ArrayList<>();
        
        visited.add(startNode);
        queue.add(startNode);
        
        System.out.print("BFS Path: ");
        while (!queue.isEmpty()) {
            int node = queue.remove(0); // Dequeue
            System.out.print(node + " ");
            
            List<Integer> neighbors = graph.get(node);
            if (neighbors != null) {
                for (int neighbor : neighbors) {
                    if (!visited.contains(neighbor)) {
                        visited.add(neighbor);
                        queue.add(neighbor);
                    }
                }
            }
        }
        System.out.println();
    }
}`,

    'Frequency Map': `import java.util.Map;
import java.util.HashMap;

public class Solution {
    public static void main(String[] args) {
        int[] arr = new int[]{1, 2, 1, 3, 2, 1};
        Map<Integer, Integer> map = getFrequencyMap(arr);
        System.out.println("Freq 1: " + map.get(1));
        System.out.println("Freq 2: " + map.get(2));
    }

    public static Map<Integer, Integer> getFrequencyMap(int[] arr) {
        Map<Integer, Integer> freqMap = new HashMap<>();
        for (int num : arr) {
            if (!freqMap.containsKey(num)) {
                freqMap.put(num, 0);
            }
            freqMap.put(num, freqMap.get(num) + 1);
        }
        return freqMap;
    }
}`
};

export function loadTemplate(templateName) {
    if (!TEMPLATES[templateName]) return false;
    setCode(TEMPLATES[templateName]);
    return true;
}
