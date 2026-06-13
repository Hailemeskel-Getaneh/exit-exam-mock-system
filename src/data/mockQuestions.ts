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
  }
];
