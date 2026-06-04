import { getEditor } from './editor.js';

export const SNIPPETS = {
    'Binary Search': `// Binary Search implementation
int binarySearch(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
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
}`,

    'Bubble Sort': `// Bubble Sort implementation
void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // swap
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,

    'Reverse Linked List': `// Reverse Linked List (Node definition is required)
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode current = head;
    while (current != null) {
        ListNode nextTemp = current.next;
        current.next = prev;
        prev = current;
        current = nextTemp;
    }
    return prev;
}`,

    'Graph BFS': `// BFS Traversal using Queue (ArrayList and Map based)
void bfs(Map<Integer, List<Integer>> graph, int startNode) {
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
}`,

    'Frequency Map': `// Count frequencies of array elements
Map<Integer, Integer> getFrequencyMap(int[] arr) {
    Map<Integer, Integer> freqMap = new HashMap<>();
    for (int num : arr) {
        if (!freqMap.containsKey(num)) {
            freqMap.put(num, 0);
        }
        freqMap.put(num, freqMap.get(num) + 1);
    }
    return freqMap;
}`
};

export function injectSnippet(snippetName) {
    const editor = getEditor();
    if (!editor || !SNIPPETS[snippetName]) return false;

    const selection = editor.getSelection();
    const range = new window.monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
    );
    
    const text = SNIPPETS[snippetName];
    
    editor.executeEdits('snippets', [{
        range: range,
        text: text,
        forceMoveMarkers: true
    }]);
    
    editor.focus();
    return true;
}
