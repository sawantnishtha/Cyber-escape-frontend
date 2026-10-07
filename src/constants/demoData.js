// DEMO GAME DATA FOR CYBER ESCAPE
// Can be cleanly replaced by actual contest content from Supabase.

export const DEMO_TEAMS = [
  { id: 'team-001', team_name: 'TEAM ALPHA', team_key_hash: 'CE-DEMO-001', current_round: 1, status: 'active' },
  { id: 'team-002', team_name: 'TEAM BETA', team_key_hash: 'CE-DEMO-002', current_round: 1, status: 'active' },
  { id: 'team-003', team_name: 'TEAM GAMMA', team_key_hash: 'CE-DEMO-003', current_round: 1, status: 'active' },
  { id: 'team-004', team_name: 'TEAM DELTA', team_key_hash: 'CE-DEMO-004', current_round: 1, status: 'active' },
  { id: 'team-005', team_name: 'TEAM EPSILON', team_key_hash: 'CE-DEMO-005', current_round: 1, status: 'active' },
  { id: 'team-006', team_name: 'TEAM ZETA', team_key_hash: 'CE-DEMO-006', current_round: 1, status: 'active' },
  { id: 'team-007', team_name: 'TEAM ETA', team_key_hash: 'CE-DEMO-007', current_round: 1, status: 'active' },
  { id: 'team-008', team_name: 'TEAM THETA', team_key_hash: 'CE-DEMO-008', current_round: 1, status: 'active' },
  { id: 'team-009', team_name: 'TEAM IOTA', team_key_hash: 'CE-DEMO-009', current_round: 1, status: 'active' },
  { id: 'team-010', team_name: 'TEAM KAPPA', team_key_hash: 'CE-DEMO-010', current_round: 1, status: 'active' },
  { id: 'team-011', team_name: 'TEAM LAMBDA', team_key_hash: 'CE-DEMO-011', current_round: 1, status: 'active' },
  { id: 'team-012', team_name: 'TEAM MU', team_key_hash: 'CE-DEMO-012', current_round: 1, status: 'active' },
  { id: 'team-013', team_name: 'TEAM NEXUS', team_key_hash: 'CE-DEMO-013', current_round: 1, status: 'active' },
  { id: 'team-014', team_name: 'TEAM QUANTUM', team_key_hash: 'CE-DEMO-014', current_round: 1, status: 'active' },
  { id: 'team-015', team_name: 'TEAM PHOENIX', team_key_hash: 'CE-DEMO-015', current_round: 1, status: 'active' },
  { id: 'team-016', team_name: 'TEAM STUDENT 2', team_key_hash: 'CE-DEMO-016', current_round: 1, status: 'active' }
];

// ROUND 1: 8 Multiple Choice Questions
export const DEMO_ROUND_1_QUESTIONS = [
  {
    round_number: 1,
    question_number: 1,
    question_type: 'mcq',
    difficulty: 'easy',
    time_limit_seconds: 45,
    question_data: {
      question: 'What does CPU stand for in computer hardware architecture?',
      options: [
        'Central Processing Unit',
        'Computer Processing Utility',
        'Central Program Unit',
        'Core Processing Utility'
      ]
    },
    correct_answer: 'Central Processing Unit',
    hint_data: 'Often referred to as the computational brain of a computing system.'
  },
  {
    round_number: 1,
    question_number: 2,
    question_type: 'mcq',
    difficulty: 'easy',
    time_limit_seconds: 45,
    question_data: {
      question: 'Which linear data structure strictly adheres to the First-In-First-Out (FIFO) access order?',
      options: [
        'Stack',
        'Queue',
        'Binary Search Tree',
        'Max Heap'
      ]
    },
    correct_answer: 'Queue',
    hint_data: 'Analogous to a line of people waiting for their turn at an airport gate.'
  },
  {
    round_number: 1,
    question_number: 3,
    question_type: 'mcq',
    difficulty: 'medium',
    time_limit_seconds: 45,
    question_data: {
      question: 'Which internet protocol guarantees encrypted transmission of web pages using TLS/SSL?',
      options: [
        'HTTP',
        'FTP',
        'HTTPS',
        'SMTP'
      ]
    },
    correct_answer: 'HTTPS',
    hint_data: 'It renders a green lock icon next to the browser URL.'
  },
  {
    round_number: 1,
    question_number: 4,
    question_type: 'mcq',
    difficulty: 'medium',
    time_limit_seconds: 45,
    question_data: {
      question: 'What is the average-case time complexity of searching a value in a balanced Binary Search Tree (AVL/Red-Black)?',
      options: [
        'O(1)',
        'O(n)',
        'O(log n)',
        'O(n log n)'
      ]
    },
    correct_answer: 'O(log n)',
    hint_data: 'At each comparison, half of the remaining subtrees are eliminated.'
  },
  {
    round_number: 1,
    question_number: 5,
    question_type: 'mcq',
    difficulty: 'medium',
    time_limit_seconds: 45,
    question_data: {
      question: 'In SQL, which clause is specifically used to filter groups of records resulting from a GROUP BY aggregate?',
      options: [
        'WHERE',
        'HAVING',
        'ORDER BY',
        'LIMIT'
      ]
    },
    correct_answer: 'HAVING',
    hint_data: 'WHERE filters rows before aggregation; this clause filters afterwards.'
  },
  {
    round_number: 1,
    question_number: 6,
    question_type: 'mcq',
    difficulty: 'hard',
    time_limit_seconds: 45,
    question_data: {
      question: 'Which CPU scheduling strategy is provably optimal in terms of minimizing average waiting time for a set of stationary processes?',
      options: [
        'First-Come, First-Served (FCFS)',
        'Shortest Job First (SJF)',
        'Round Robin (RR)',
        'Priority Scheduling'
      ]
    },
    correct_answer: 'Shortest Job First (SJF)',
    hint_data: 'Processes with the smallest CPU burst times execute first.'
  },
  {
    round_number: 1,
    question_number: 7,
    question_type: 'mcq',
    difficulty: 'hard',
    time_limit_seconds: 45,
    question_data: {
      question: 'Which layer of the 7-layer OSI reference model provides end-to-end communication services and port multiplexing?',
      options: [
        'Network Layer',
        'Data Link Layer',
        'Transport Layer',
        'Session Layer'
      ]
    },
    correct_answer: 'Transport Layer',
    hint_data: 'The home layer of TCP and UDP.'
  },
  {
    round_number: 1,
    question_number: 8,
    question_type: 'mcq',
    difficulty: 'hard',
    time_limit_seconds: 45,
    question_data: {
      question: 'In asymmetric public-key cryptography, which mathematical property enables secure digital signatures and key exchange?',
      options: [
        'XOR bitwise permutations',
        'One-way trapdoor functions with prime factorization or elliptic curves',
        'Linear feedback shift registers',
        'Caesar substitution arrays'
      ]
    },
    correct_answer: 'One-way trapdoor functions with prime factorization or elliptic curves',
    hint_data: 'Easy to compute in one direction, virtually impossible to invert without the private trapdoor.'
  }
];

// ROUND 2: 2 Technical Crosswords (100% mathematically verified letter intersections)
export const DEMO_ROUND_2_CROSSWORDS = [
  {
    round_number: 2,
    question_number: 1,
    question_type: 'crossword',
    difficulty: 'easy',
    time_limit_seconds: 300,
    question_data: {
      title: 'Cryptographic Grid 1: Computing Architecture & Security',
      gridRows: 5,
      gridCols: 6,
      gridSize: 6,
      words: [
        { id: 1, number: 1, direction: 'across', clue: 'High-speed auxiliary hardware memory buffer (5)', answer: 'CACHE', row: 0, col: 1 },
        { id: 2, number: 1, direction: 'down', clue: 'Prefix relating to information technology and network security (5)', answer: 'CYBER', row: 0, col: 1 },
        { id: 3, number: 2, direction: 'down', clue: 'Distributed remote servers hosting scalable storage and compute (5)', answer: 'CLOUD', row: 0, col: 3 },
        { id: 4, number: 3, direction: 'across', clue: 'Firmware initializing hardware components during system boot (4)', answer: 'BIOS', row: 2, col: 1 },
        { id: 5, number: 4, direction: 'across', clue: 'Systematic process of finding and eliminating software defects (5)', answer: 'DEBUG', row: 3, col: 0 }
      ]
    },
    correct_answer: 'COMPLETED',
    hint_data: 'Focus on computer architecture: Cache memory, Cyber domain, Cloud infrastructure, BIOS firmware, and Debugging.'
  },
  {
    round_number: 2,
    question_number: 2,
    question_type: 'crossword',
    difficulty: 'hard',
    time_limit_seconds: 300,
    question_data: {
      title: 'Cryptographic Grid 2: Advanced Systems & Protocols',
      gridRows: 6,
      gridCols: 8,
      gridSize: 8,
      words: [
        { id: 1, number: 1, direction: 'across', clue: 'Formatted unit of digital data routed across a packet-switched network (6)', answer: 'PACKET', row: 0, col: 0 },
        { id: 2, number: 1, direction: 'down', clue: 'Interpreted high-level programming language widely used in AI & automation (6)', answer: 'PYTHON', row: 0, col: 0 },
        { id: 3, number: 2, direction: 'down', clue: 'Cryptographic algorithm performing reversible encryption and decryption (6)', answer: 'CIPHER', row: 0, col: 2 },
        { id: 4, number: 3, direction: 'down', clue: 'Redundant auxiliary failover or surplus computing capacity (5)', answer: 'EXTRA', row: 0, col: 4 },
        { id: 5, number: 4, direction: 'across', clue: 'Core transmission protocol that guarantees reliable, ordered byte delivery (3)', answer: 'TCP', row: 2, col: 0 },
        { id: 6, number: 5, direction: 'across', clue: 'Symbol or keyword specifying an arithmetic or logical calculation in code (8)', answer: 'OPERATOR', row: 4, col: 0 }
      ]
    },
    correct_answer: 'COMPLETED',
    hint_data: 'Think about packets, Python scripts, cryptographic ciphers, redundant resources, TCP connections, and mathematical operators.'
  }
];

// ROUND 3: 4 Binary-to-ASCII questions (2 to 3 technical words per challenge)
export const DEMO_ROUND_3_QUESTIONS = [
  {
    round_number: 3,
    question_number: 1,
    question_type: 'binary',
    difficulty: 'medium',
    time_limit_seconds: 60,
    question_data: {
      binary: '01011010 01000101 01010010 01001111 00100000 01010100 01010010 01010101 01010011 01010100',
      instruction: 'Decode the 2-word security architecture principle from the 8-bit ASCII bitstream (separate words with a single space).'
    },
    correct_answer: 'ZERO TRUST',
    hint_data: 'Word 1: Z-E-R-O (90, 69, 82, 79). Byte 5 is space (32). Word 2: T-R-U-S-T (84, 82, 85, 83, 84).'
  },
  {
    round_number: 3,
    question_number: 2,
    question_type: 'binary',
    difficulty: 'medium',
    time_limit_seconds: 60,
    question_data: {
      binary: '01000011 01011001 01000010 01000101 01010010 00100000 01000100 01000101 01000110 01000101 01001110 01010011 01000101',
      instruction: 'Decode the 2-word defensive cybersecurity phrase from the incoming 8-bit stream.'
    },
    correct_answer: 'CYBER DEFENSE',
    hint_data: 'Word 1 is C-Y-B-E-R (67, 89, 66, 69, 82). Word 2 is D-E-F-E-N-S-E (68, 69, 70, 69, 78, 83, 69).'
  },
  {
    round_number: 3,
    question_number: 3,
    question_type: 'binary',
    difficulty: 'hard',
    time_limit_seconds: 60,
    question_data: {
      binary: '01010011 01000101 01000011 01010101 01010010 01000101 00100000 01010010 01001111 01001111 01010100 00100000 01001011 01000101 01011001',
      instruction: 'Decode the 3-word cryptographic root credential phrase from the 8-bit binary matrix.'
    },
    correct_answer: 'SECURE ROOT KEY',
    hint_data: 'Three words: S-E-C-U-R-E (83, 69, 67, 85, 82, 69), R-O-O-T (82, 79, 79, 84), and K-E-Y (75, 69, 89).'
  },
  {
    round_number: 3,
    question_number: 4,
    question_type: 'binary',
    difficulty: 'hard',
    time_limit_seconds: 60,
    question_data: {
      binary: '01000001 01000011 01000011 01000101 01010011 01010011 00100000 01000100 01000101 01001110 01001001 01000101 01000100 00100000 01001100 01001111 01000011 01001011',
      instruction: 'Decode the 3-word system lockdown authorization phrase from the binary bitstream.'
    },
    correct_answer: 'ACCESS DENIED LOCK',
    hint_data: 'Three words: A-C-C-E-S-S (65, 67, 67, 69, 83, 83), D-E-N-I-E-D (68, 69, 78, 73, 69, 68), and L-O-C-K (76, 79, 67, 75).'
  }
];

// ROUND 4: 4 Multi-Language Logic Problems (20-30 lines of code, 3 to 4 blanks)
export const DEMO_ROUND_4_QUESTIONS = [
  {
    round_number: 4,
    question_number: 1,
    question_type: 'code_fill',
    difficulty: 'medium',
    time_limit_seconds: 90,
    question_data: {
      title: 'Cryptographic Stream Substitution (Caesar Shift Cipher)',
      description: 'Inspect the stream cipher subroutine. Fill in the shift key variable, alphabet modulo wrap constant, and unmodified character assignment.',
      blanksCount: 3,
      labels: ['Key shift variable', 'Alphabet modulus wrap constant', 'Unmodified character variable'],
      snippets: {
        cpp: `#include <iostream>
#include <string>
using namespace std;

// Encrypt uppercase plaintext buffer with Caesar rotation
string encryptBuffer(string buffer, int shift) {
    string cipherText = "";
    int length = buffer.length();

    for (int i = 0; i < length; i++) {
        char ch = buffer[i];
        if (ch >= 'A' && ch <= 'Z') {
            int base = 'A';
            int offset = ch - base;
            // Apply rotation and wrap within 26 letters
            int shifted = (offset + /* blank_0 */) % /* blank_1 */;
            char encryptedChar = (char)(base + shifted);
            cipherText += encryptedChar;
        } else {
            // Keep non-alphabet characters unchanged
            cipherText += /* blank_2 */;
        }
    }
    return cipherText;
}

int main() {
    cout << encryptBuffer("CYBER", 3);
    return 0;
}`,
        python: `# Encrypt uppercase plaintext buffer with Caesar rotation
def encrypt_buffer(buffer_str, shift):
    cipher_text = []
    length = len(buffer_str)

    for i in range(length):
        ch = buffer_str[i]
        if 'A' <= ch <= 'Z':
            base = ord('A')
            offset = ord(ch) - base
            # Apply rotation and wrap within 26 letters
            shifted = (offset + /* blank_0 */) % /* blank_1 */
            encrypted_char = chr(base + shifted)
            cipher_text.append(encrypted_char)
        else:
            # Keep non-alphabet characters unchanged
            cipher_text.append(/* blank_2 */)

    return "".join(cipher_text)

if __name__ == "__main__":
    print(encrypt_buffer("CYBER", 3))`,
        java: `public class CaesarCipher {
    // Encrypt uppercase plaintext buffer with Caesar rotation
    public static String encryptBuffer(String buffer, int shift) {
        StringBuilder cipherText = new StringBuilder();
        int length = buffer.length();

        for (int i = 0; i < length; i++) {
            char ch = buffer.charAt(i);
            if (ch >= 'A' && ch <= 'Z') {
                int base = 'A';
                int offset = ch - base;
                // Apply rotation and wrap within 26 letters
                int shifted = (offset + /* blank_0 */) % /* blank_1 */;
                char encryptedChar = (char)(base + shifted);
                cipherText.append(encryptedChar);
            } else {
                // Keep non-alphabet characters unchanged
                cipherText.append(/* blank_2 */);
            }
        }
        return cipherText.toString();
    }

    public static void main(String[] args) {
        System.out.println(encryptBuffer("CYBER", 3));
    }
}`
      }
    },
    correct_answer: 'shift,26,ch',
    hint_data: 'Blank 0 applies variable shift; Blank 1 wraps by 26 letters; Blank 2 appends unchanged ch.'
  },
  {
    round_number: 4,
    question_number: 2,
    question_type: 'code_fill',
    difficulty: 'medium',
    time_limit_seconds: 90,
    question_data: {
      title: 'Transmission Packet Checksum Accumulator (RFC 1071)',
      description: 'Complete the loop iteration variable, 16-bit fold-over mask constant, and output return variable for internet packet verification.',
      blanksCount: 3,
      labels: ['Loop index variable', '16-bit fold mask constant (hex)', 'Output checksum variable'],
      snippets: {
        cpp: `#include <iostream>
#include <vector>
using namespace std;

// Calculate RFC 1071 style 16-bit packet checksum
unsigned short computeChecksum(const vector<int>& packet) {
    unsigned long sum = 0;
    int length = packet.size();

    for (int i = 0; i < length; /* blank_0 */++) {
        sum += packet[i];
        // Fold 32-bit overflow carries back into lower 16 bits
        while ((sum >> 16) > 0) {
            sum = (sum & /* blank_1 */) + (sum >> 16);
        }
    }

    // Bitwise 1's complement of accumulated sum
    unsigned short checksum = ~sum;
    return /* blank_2 */;
}

int main() {
    vector<int> packet = {0x4500, 0x003c, 0x1c46, 0x4000};
    cout << hex << computeChecksum(packet);
    return 0;
}`,
        python: `# Calculate RFC 1071 style 16-bit packet checksum
def compute_checksum(packet):
    acc_sum = 0
    length = len(packet)
    i = 0

    while i < length:
        acc_sum += packet[i]
        # Fold 32-bit overflow carries back into lower 16 bits
        while (acc_sum >> 16) > 0:
            acc_sum = (acc_sum & /* blank_1 */) + (acc_sum >> 16)
        /* blank_0 */ += 1

    # Bitwise 1's complement of accumulated sum
    checksum = ~acc_sum & 0xFFFF
    return /* blank_2 */

if __name__ == "__main__":
    packet = [0x4500, 0x003c, 0x1c46, 0x4000]
    print(hex(compute_checksum(packet)))`,
        java: `public class PacketVerifier {
    // Calculate RFC 1071 style 16-bit packet checksum
    public static int computeChecksum(int[] packet) {
        int sum = 0;
        int length = packet.length;

        for (int i = 0; i < length; /* blank_0 */++) {
            sum += packet[i];
            // Fold 32-bit overflow carries back into lower 16 bits
            while ((sum >> 16) > 0) {
                sum = (sum & /* blank_1 */) + (sum >> 16);
            }
        }

        // Bitwise 1's complement of accumulated sum
        int checksum = (~sum) & 0xFFFF;
        return /* blank_2 */;
    }

    public static void main(String[] args) {
        int[] packet = {0x4500, 0x003c, 0x1c46, 0x4000};
        System.out.println(Integer.toHexString(computeChecksum(packet)));
    }
}`
      }
    },
    correct_answer: 'i,0xFFFF,checksum',
    hint_data: 'Blank 0 is loop index i; Blank 1 is 16-bit mask 0xFFFF; Blank 2 returns checksum.'
  },
  {
    round_number: 4,
    question_number: 3,
    question_type: 'code_fill',
    difficulty: 'hard',
    time_limit_seconds: 90,
    question_data: {
      title: 'Cyclic Redundancy Check (CRC-8 Polynomial Generator)',
      description: 'Fill the bit loop limit, most-significant-bit mask (0x80), bitwise XOR operator, and accumulated register variable.',
      blanksCount: 4,
      labels: ['Bits per byte count', 'MSB bitmask (hex)', 'Bitwise XOR operator', 'Accumulated CRC variable'],
      snippets: {
        cpp: `#include <iostream>
#include <vector>
using namespace std;

// Compute 8-bit Cyclic Redundancy Check (CRC-8)
unsigned char computeCRC8(const vector<unsigned char>& data, unsigned char poly) {
    unsigned char crc = 0x00; // Initial CRC register

    for (int i = 0; i < data.size(); i++) {
        crc = crc ^ data[i]; // XOR input byte into register

        for (int bit = 0; bit < /* blank_0 */; bit++) {
            if (crc & /* blank_1 */) {
                // MSB is 1: shift left and XOR with generator polynomial
                crc = (crc << 1) /* blank_2 */ poly;
            } else {
                // MSB is 0: simple left shift
                crc = (crc << 1);
            }
        }
    }
    return /* blank_3 */;
}

int main() {
    vector<unsigned char> data = {0x01, 0x02, 0x03};
    cout << hex << (int)computeCRC8(data, 0x07);
    return 0;
}`,
        python: `# Compute 8-bit Cyclic Redundancy Check (CRC-8)
def compute_crc8(data, poly):
    crc = 0x00  # Initial CRC register

    for byte in data:
        crc = crc ^ byte  # XOR input byte into register

        for bit in range(/* blank_0 */):
            if crc & /* blank_1 */:
                # MSB is 1: shift left and XOR with generator polynomial
                crc = ((crc << 1) /* blank_2 */ poly) & 0xFF
            else:
                # MSB is 0: simple left shift
                crc = (crc << 1) & 0xFF

    return /* blank_3 */

if __name__ == "__main__":
    data = [0x01, 0x02, 0x03]
    print(hex(compute_crc8(data, 0x07)))`,
        java: `public class CRCValidator {
    // Compute 8-bit Cyclic Redundancy Check (CRC-8)
    public static int computeCRC8(int[] data, int poly) {
        int crc = 0x00; // Initial CRC register

        for (int i = 0; i < data.length; i++) {
            crc = (crc ^ data[i]) & 0xFF; // XOR input byte into register

            for (int bit = 0; bit < /* blank_0 */; bit++) {
                if ((crc & /* blank_1 */) != 0) {
                    // MSB is 1: shift left and XOR with generator polynomial
                    crc = ((crc << 1) /* blank_2 */ poly) & 0xFF;
                } else {
                    // MSB is 0: simple left shift
                    crc = (crc << 1) & 0xFF;
                }
            }
        }
        return /* blank_3 */;
    }

    public static void main(String[] args) {
        int[] data = {0x01, 0x02, 0x03};
        System.out.println(Integer.toHexString(computeCRC8(data, 0x07)));
    }
}`
      }
    },
    correct_answer: '8,0x80,^,crc',
    hint_data: 'Blank 0 is 8 bits; Blank 1 masks MSB with 0x80; Blank 2 is XOR (^); Blank 3 returns crc.'
  },
  {
    round_number: 4,
    question_number: 4,
    question_type: 'code_fill',
    difficulty: 'hard',
    time_limit_seconds: 90,
    question_data: {
      title: 'Secure Ring Buffer Bounds Guard & Pointer Wrap',
      description: 'Fill in the current counter, capacity bound, modulo circular wraparound operator, and boolean success return indicator.',
      blanksCount: 4,
      labels: ['Current elements counter', 'Buffer maximum capacity', 'Circular index modulo operator', 'Boolean success return'],
      snippets: {
        cpp: `#include <iostream>
#include <vector>
using namespace std;

class SecureRingBuffer {
private:
    vector<int> buffer;
    int head = 0;
    int tail = 0;
    int count = 0;
    int capacity;

public:
    SecureRingBuffer(int cap) : capacity(cap), buffer(cap) {}

    bool push(int data) {
        // Prevent buffer overrun vulnerability
        if (/* blank_0 */ >= /* blank_1 */) {
            return false; // Buffer overflow guard triggered
        }

        buffer[tail] = data;
        // Advance tail with circular wraparound
        tail = (tail + 1) /* blank_2 */ capacity;
        count++;
        return /* blank_3 */;
    }

    int size() { return count; }
};

int main() {
    SecureRingBuffer q(5);
    cout << (q.push(42) ? "OK" : "OVERFLOW");
    return 0;
}`,
        python: `class SecureRingBuffer:
    def __init__(self, cap):
        self.capacity = cap
        self.buffer = [0] * cap
        self.head = 0
        self.tail = 0
        self.count = 0

    def push(self, data):
        # Prevent buffer overrun vulnerability
        if self./* blank_0 */ >= self./* blank_1 */:
            return False  # Buffer overflow guard triggered

        self.buffer[self.tail] = data
        # Advance tail with circular wraparound
        self.tail = (self.tail + 1) /* blank_2 */ self.capacity
        self.count += 1
        return /* blank_3 */

    def size(self):
        return self.count

if __name__ == "__main__":
    q = SecureRingBuffer(5)
    print("OK" if q.push(42) else "OVERFLOW")`,
        java: `public class SecureRingBuffer {
    private int[] buffer;
    private int head = 0;
    private int tail = 0;
    private int count = 0;
    private int capacity;

    public SecureRingBuffer(int cap) {
        this.capacity = cap;
        this.buffer = new int[cap];
    }

    public boolean push(int data) {
        // Prevent buffer overrun vulnerability
        if (/* blank_0 */ >= /* blank_1 */) {
            return false; // Buffer overflow guard triggered
        }

        buffer[tail] = data;
        // Advance tail with circular wraparound
        tail = (tail + 1) /* blank_2 */ capacity;
        count++;
        return /* blank_3 */;
    }

    public static void main(String[] args) {
        SecureRingBuffer q = new SecureRingBuffer(5);
        System.out.println(q.push(42) ? "OK" : "OVERFLOW");
    }
}`
      }
    },
    correct_answer: 'count,capacity,%,true',
    hint_data: 'Blank 0 is count; Blank 1 is capacity; Blank 2 is modulo (%); Blank 3 returns true.'
  }
];

// ASCII Table for quick reference in Round 3 (including SPACE)
export const ASCII_REFERENCE_TABLE = [
  { char: 'SPACE', dec: 32, bin: '00100000' },
  { char: 'A', dec: 65, bin: '01000001' },
  { char: 'B', dec: 66, bin: '01000010' },
  { char: 'C', dec: 67, bin: '01000011' },
  { char: 'D', dec: 68, bin: '01000100' },
  { char: 'E', dec: 69, bin: '01000101' },
  { char: 'F', dec: 70, bin: '01000110' },
  { char: 'G', dec: 71, bin: '01000111' },
  { char: 'H', dec: 72, bin: '01001000' },
  { char: 'I', dec: 73, bin: '01001001' },
  { char: 'J', dec: 74, bin: '01001010' },
  { char: 'K', dec: 75, bin: '01001011' },
  { char: 'L', dec: 76, bin: '01001100' },
  { char: 'M', dec: 77, bin: '01001101' },
  { char: 'N', dec: 78, bin: '01001110' },
  { char: 'O', dec: 79, bin: '01001111' },
  { char: 'P', dec: 80, bin: '01010000' },
  { char: 'Q', dec: 81, bin: '01010001' },
  { char: 'R', dec: 82, bin: '01010010' },
  { char: 'S', dec: 83, bin: '01010011' },
  { char: 'T', dec: 84, bin: '01010100' },
  { char: 'U', dec: 85, bin: '01010101' },
  { char: 'V', dec: 86, bin: '01010110' },
  { char: 'W', dec: 87, bin: '01010111' },
  { char: 'X', dec: 88, bin: '01011000' },
  { char: 'Y', dec: 89, bin: '01011001' },
  { char: 'Z', dec: 90, bin: '01011010' }
];
