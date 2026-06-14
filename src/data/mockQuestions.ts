export interface Question {
  id: number;
  text: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  department: string;
  durationMinutes: number;
  questions: Question[];
}

export const mockExams: Exam[] = [
  {
    id: "mech-2024",
    title: "Model Exit Exam for Mechanical Engineering 2024",
    department: "Mechanical Engineering",
    durationMinutes: 180,
    questions: [
      {
        id: 1,
        text: "Which of the following is not the function of a spring?",
        options: {
          a: "They are used for the measurement of force and to control motion",
          b: "They are used to store energy",
          c: "They are used to absorb shocks and vibrations",
          d: "They are used to measure displacement"
        },
        correctAnswer: "d",
        points: 1.0
      },
      {
        id: 2,
        text: "The ratio of linear stress to linear strain is called:",
        options: {
          a: "Bulk Modulus",
          b: "Young's Modulus",
          c: "Modulus of Rigidity",
          d: "Poisson's Ratio"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 3,
        text: "Which type of key is used for transmitting power through a gear or pulley that must slide axially on the shaft?",
        options: {
          a: "Woodruff key",
          b: "Feather key",
          c: "Flat saddle key",
          d: "Gib-headed key"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 4,
        text: "What type of thermodynamic cycle is used in gasoline engines?",
        options: {
          a: "Diesel Cycle",
          b: "Carnot Cycle",
          c: "Otto Cycle",
          d: "Rankine Cycle"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 5,
        text: "The property of a material to resist penetration or scratching is known as:",
        options: {
          a: "Ductility",
          b: "Hardness",
          c: "Toughness",
          d: "Malleability"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 6,
        text: "Which of the following is a unit of dynamic viscosity?",
        options: {
          a: "m²/s",
          b: "N·s/m² (or Pa·s)",
          c: "kg/m³",
          d: "N/m"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 7,
        text: "For a heat engine operating between two temperatures, the maximum possible efficiency is given by the:",
        options: {
          a: "Rankine cycle efficiency",
          b: "Otto cycle efficiency",
          c: "Carnot cycle efficiency",
          d: "Stirling cycle efficiency"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 8,
        text: "In a fluid flow, if the velocity of the fluid at any point does not change with time, the flow is said to be:",
        options: {
          a: "Steady flow",
          b: "Uniform flow",
          c: "Laminar flow",
          d: "Turbulent flow"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 9,
        text: "Which of the following couplings is used to connect two shafts that are perfectly aligned?",
        options: {
          a: "Universal coupling",
          b: "Flange coupling",
          c: "Oldham's coupling",
          d: "Flexible coupling"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 10,
        text: "In refrigeration systems, the throttling device is placed between the:",
        options: {
          a: "Compressor and Condenser",
          b: "Condenser and Evaporator",
          c: "Evaporator and Compressor",
          d: "Evaporator and Receiver"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  },
  {
    id: "cs-2024",
    title: "Model Exit Exam for Computer Science 2024",
    department: "Computer Science",
    durationMinutes: 180,
    questions: [
      {
        id: 1,
        text: "Which data structure uses the Last-In-First-Out (LIFO) principle?",
        options: {
          a: "Queue",
          b: "Stack",
          c: "Linked List",
          d: "Binary Search Tree"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 2,
        text: "Which of the following sorting algorithms has the best worst-case time complexity?",
        options: {
          a: "Bubble Sort",
          b: "Quick Sort",
          c: "Merge Sort",
          d: "Insertion Sort"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 3,
        text: "In Database Management Systems, what does ACID stand for?",
        options: {
          a: "Atomicity, Consistency, Isolation, Durability",
          b: "Accuracy, Consistency, Integration, Database",
          c: "Association, Concurrency, Isolation, Dependability",
          d: "Algorithm, Complexity, Indexing, Data"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 4,
        text: "Which of the following is not a valid state of a process in an operating system?",
        options: {
          a: "Ready",
          b: "Running",
          c: "Waiting",
          d: "Interrupted"
        },
        correctAnswer: "d",
        points: 1.0
      },
      {
        id: 5,
        text: "What is the primary function of the Domain Name System (DNS)?",
        options: {
          a: "To encrypt web traffic",
          b: "To route packets between networks",
          c: "To map human-readable domain names to IP addresses",
          d: "To allocate dynamic IP addresses to hosts"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 6,
        text: "Which layer of the OSI model is responsible for routing and packet forwarding?",
        options: {
          a: "Physical Layer",
          b: "Data Link Layer",
          c: "Network Layer",
          d: "Transport Layer"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 7,
        text: "What does SQL stand for?",
        options: {
          a: "Structured Query Language",
          b: "Simple Query Language",
          c: "Standard Quantitative Loop",
          d: "Sequential Query List"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 8,
        text: "In Object-Oriented Programming, the ability of a class to inherit features from more than one parent class is called:",
        options: {
          a: "Polymorphism",
          b: "Multiple Inheritance",
          c: "Encapsulation",
          d: "Abstraction"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 9,
        text: "Which of the following is an example of a stateless protocol?",
        options: {
          a: "HTTP",
          b: "FTP",
          c: "TCP",
          d: "SSH"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 10,
        text: "What is the main purpose of an Index in a relational database?",
        options: {
          a: "To enforce referential integrity",
          b: "To store history of transactions",
          c: "To speed up data retrieval operations",
          d: "To compress the database files"
        },
        correctAnswer: "c",
        points: 1.0
      }
    ]
  },
  {
    id: "it-2024",
    title: "Model Exit Exam for Information Technology 2024",
    department: "Information Technology",
    durationMinutes: 180,
    questions: [
      {
        id: 1,
        text: "Which IP address class is designed for multicast addressing?",
        options: {
          a: "Class A",
          b: "Class B",
          c: "Class C",
          d: "Class D"
        },
        correctAnswer: "d",
        points: 1.0
      },
      {
        id: 2,
        text: "In network security, what does a Firewall primarily do?",
        options: {
          a: "Cleans viruses from the computer",
          b: "Filters incoming and outgoing network traffic based on security rules",
          c: "Encrypts all stored files on a hard drive",
          d: "Speeds up internet connection"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 3,
        text: "Which of the following is a core component of a CPU?",
        options: {
          a: "Arithmetic Logic Unit (ALU)",
          b: "Hard Disk Drive (HDD)",
          c: "Solid State Drive (SSD)",
          d: "Network Interface Card (NIC)"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 4,
        text: "Which SQL keyword is used to sort the result-set?",
        options: {
          a: "SORT BY",
          b: "ORDER BY",
          c: "GROUP BY",
          d: "ARRANGE BY"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 5,
        text: "Which technology is commonly used to create a secure encrypted connection over a less secure network?",
        options: {
          a: "HTTP",
          b: "FTP",
          c: "VPN",
          d: "DNS"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 6,
        text: "In HTML, which tag is used to create a hyperlink?",
        options: {
          a: "<link>",
          b: "<a>",
          c: "<href>",
          d: "<a>link</a>"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 7,
        text: "Which cloud computing model offers virtualization, storage, and networking resources over the internet?",
        options: {
          a: "SaaS",
          b: "PaaS",
          c: "IaaS",
          d: "DaaS"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 8,
        text: "What does CSS stand for?",
        options: {
          a: "Creative Style Sheets",
          b: "Computer Style Sheets",
          c: "Cascading Style Sheets",
          d: "Colorful Style Sheets"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 9,
        text: "Which of the following is a type of cyber attack that floods a server with traffic to make it unavailable?",
        options: {
          a: "Phishing",
          b: "DDoS",
          c: "SQL Injection",
          d: "Man-in-the-Middle"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 10,
        text: "What is the primary function of an Operating System's kernel?",
        options: {
          a: "To display the graphical user interface",
          b: "To manage system resources and communication between hardware and software",
          c: "To run web applications",
          d: "To scan for viruses"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  },
  {
    id: "english-2024",
    title: "Model Exit Exam for English Language 2024",
    department: "English",
    durationMinutes: 180,
    questions: [
      {
        id: 1,
        text: "Identify the synonym of the word 'diligent'.",
        options: {
          a: "Lazy",
          b: "Hardworking",
          c: "Careless",
          d: "Intelligent"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 2,
        text: "Which of the following sentences is grammatically correct?",
        options: {
          a: "She don't like coffee.",
          b: "She doesn't like coffee.",
          c: "She doesn't likes coffee.",
          d: "She not like coffee."
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 3,
        text: "What is the antonym of the word 'generous'?",
        options: {
          a: "Kind",
          b: "Stingy",
          c: "Helpful",
          d: "Polite"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 4,
        text: "Choose the correct spelling:",
        options: {
          a: "Neccessary",
          b: "Necessary",
          c: "Necassary",
          d: "Necesary"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 5,
        text: "In the sentence 'The cat slept peacefully on the couch', what is 'peacefully'?",
        options: {
          a: "Adjective",
          b: "Adverb",
          c: "Noun",
          d: "Verb"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 6,
        text: "Which of the following is a Coordinating Conjunction?",
        options: {
          a: "Because",
          b: "But",
          c: "Although",
          d: "Since"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 7,
        text: "What is the passive voice of 'The teacher is teaching the students'?",
        options: {
          a: "The students are taught by the teacher.",
          b: "The students are being taught by the teacher.",
          c: "The students were taught by the teacher.",
          d: "The teacher has been taught by the students."
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 8,
        text: "Choose the correct preposition: 'She has been living in Addis Ababa ____ 2018.'",
        options: {
          a: "for",
          b: "since",
          c: "at",
          d: "on"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 9,
        text: "Which literary device refers to an extreme exaggeration used for emphasis or effect?",
        options: {
          a: "Metaphor",
          b: "Hyperbole",
          c: "Simile",
          d: "Personification"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 10,
        text: "What is the main theme of a story or poem?",
        options: {
          a: "The central message or idea",
          b: "The climax of the action",
          c: "The list of characters",
          d: "The chronological order of events"
        },
        correctAnswer: "a",
        points: 1.0
      }
    ]
  }
];
