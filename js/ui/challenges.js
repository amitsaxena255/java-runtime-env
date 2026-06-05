import { setCode } from '../editor/editor.js';
import { executeJava } from '../runner.js';

export const CHALLENGES = {
    'two-sum': {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

### Example 1:
**Input:** nums = [2,7,11,15], target = 9  
**Output:** [0,1]  
**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

### Example 2:
**Input:** nums = [3,2,4], target = 6  
**Output:** [1,2]`,
        template: `import java.util.Map;
import java.util.HashMap;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}`,
        testHarness: `
public class TestHarness {
    public static void main(String[] args) {
        try {
            int[] res1 = Solution.twoSum(new int[]{2, 7, 11, 15}, 9);
            boolean tc1 = (res1 != null && res1.length == 2 && ((res1[0] == 0 && res1[1] == 1) || (res1[0] == 1 && res1[1] == 0)));
            System.out.println("TC1:" + tc1);

            int[] res2 = Solution.twoSum(new int[]{3, 2, 4}, 6);
            boolean tc2 = (res2 != null && res2.length == 2 && ((res2[0] == 1 && res2[1] == 2) || (res2[0] == 2 && res2[1] == 1)));
            System.out.println("TC2:" + tc2);
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }
}`,
        testCasesCount: 2
    },

    'palindrome-number': {
        id: 'palindrome-number',
        title: 'Palindrome Number',
        difficulty: 'Easy',
        description: `Given an integer \`x\`, return \`true\` *if \`x\` is a palindrome, and \`false\` otherwise*.

An integer is a palindrome when it reads the same backward as forward. For example, \`121\` is a palindrome while \`123\` is not.

### Example 1:
**Input:** x = 121  
**Output:** true

### Example 2:
**Input:** x = -121  
**Output:** false  
**Explanation:** From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.`,
        template: `public class Solution {
    public static boolean isPalindrome(int x) {
        // Write your code here
        return false;
    }
}`,
        testHarness: `
public class TestHarness {
    public static void main(String[] args) {
        try {
            System.out.println("TC1:" + (Solution.isPalindrome(121) == true));
            System.out.println("TC2:" + (Solution.isPalindrome(-121) == false));
            System.out.println("TC3:" + (Solution.isPalindrome(10) == false));
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }
}`,
        testCasesCount: 3
    },

    'reverse-string': {
        id: 'reverse-string',
        title: 'Reverse String',
        difficulty: 'Easy',
        description: `Write a method that takes a \`String\` as input and returns the string reversed.

### Example 1:
**Input:** s = "hello"  
**Output:** "olleh"

### Example 2:
**Input:** s = "Hannah"  
**Output:** "hannaH"`,
        template: `public class Solution {
    public static String reverseString(String s) {
        // Write your code here
        return "";
    }
}`,
        testHarness: `
public class TestHarness {
    public static void main(String[] args) {
        try {
            System.out.println("TC1:" + "olleh".equals(Solution.reverseString("hello")));
            System.out.println("TC2:" + "hannaH".equals(Solution.reverseString("Hannah")));
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }
}`,
        testCasesCount: 2
    }
};

let activeChallengeId = null;

export function getActiveChallenge() {
    return activeChallengeId ? CHALLENGES[activeChallengeId] : null;
}

export function selectChallenge(challengeId) {
    if (!CHALLENGES[challengeId]) {
        activeChallengeId = null;
        return null;
    }
    
    activeChallengeId = challengeId;
    const challenge = CHALLENGES[challengeId];

    // Load template into Monaco editor
    setCode(challenge.template);
    
    return challenge;
}

export async function runChallengeTests(userCode) {
    if (!activeChallengeId) return null;
    
    const challenge = CHALLENGES[activeChallengeId];
    
    // We append the TestHarness main class at the end of the user's Solution.java code.
    // The test harness runs the user's static methods and outputs TC1:true / TC2:false.
    // We modify the code to strip any existing public class TestHarness wrapper and append the testHarness.
    
    const codeWithHarness = userCode + '\n' + challenge.testHarness;
    
    try {
        const rawOutput = await executeJava(codeWithHarness);
        const results = [];
        
        const lines = rawOutput.split('\n');
        let passedCount = 0;
        
        for (let i = 1; i <= challenge.testCasesCount; i++) {
            const label = `TC${i}:`;
            const matchingLine = lines.find(line => line.includes(label));
            
            if (matchingLine) {
                const passed = matchingLine.split(label)[1].trim() === 'true';
                if (passed) passedCount++;
                results.push({
                    caseNum: i,
                    status: passed ? 'PASSED' : 'FAILED',
                    details: passed ? 'Output matched expected answer' : 'Output did not match expected answer'
                });
            } else {
                results.push({
                    caseNum: i,
                    status: 'FAILED',
                    details: 'Execution error or missing print statement'
                });
            }
        }
        
        return {
            success: passedCount === challenge.testCasesCount,
            passed: passedCount,
            total: challenge.testCasesCount,
            cases: results,
            rawOutput
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message || error,
            cases: Array.from({ length: challenge.testCasesCount }).map((_, i) => ({
                caseNum: i + 1,
                status: 'ERROR',
                details: 'Compile or Runtime Error'
            }))
        };
    }
}
