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
  passcode: string;
  questions: Question[];
}

export const mockExams: Exam[] = [
  {
    id: "mech-2024",
    title: "Model Exit Exam for Mechanical Engineering 2024",
    department: "Mechanical Engineering",
    durationMinutes: 40,
    passcode: "MECH2024",
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
      },
      {
        id: 11,
        text: "Which of the following processes is used to harden the surface of steel components?",
        options: {
          a: "Nitriding",
          b: "Annealing",
          c: "Tempering",
          d: "Normalizing"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 12,
        text: "In a vapor compression refrigeration system, heat is rejected by the refrigerant in the:",
        options: {
          a: "Evaporator",
          b: "Condenser",
          c: "Compressor",
          d: "Expansion Valve"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 13,
        text: "The maximum deflection of a cantilever beam of length L under a point load W at the free end is given by:",
        options: {
          a: "WL³ / 3EI",
          b: "WL³ / 48EI",
          c: "WL³ / 8EI",
          d: "WL³ / 16EI"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 14,
        text: "In fluid mechanics, the Reynolds number is defined as the ratio of:",
        options: {
          a: "Viscous forces to gravity forces",
          b: "Inertia forces to viscous forces",
          c: "Viscous forces to pressure forces",
          d: "Inertia forces to gravity forces"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 15,
        text: "A device used to increase the pressure of a fluid by decreasing its velocity is called a:",
        options: {
          a: "Nozzle",
          b: "Diffuser",
          c: "Turbine",
          d: "Compressor"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 16,
        text: "Which of the following is a type of permanent joint?",
        options: {
          a: "Cotter joint",
          b: "Welded joint",
          c: "Threaded joint",
          d: "Knuckle joint"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 17,
        text: "The property of a material to deform permanently under load without fracture is known as:",
        options: {
          a: "Elasticity",
          b: "Plasticity",
          c: "Brittleness",
          d: "Stiffness"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 18,
        text: "In a heat exchanger, if both hot and cold fluids flow in the same direction, it is classified as a:",
        options: {
          a: "Counter flow heat exchanger",
          b: "Parallel flow heat exchanger",
          c: "Cross flow heat exchanger",
          d: "Mixed flow heat exchanger"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 19,
        text: "The velocity ratio of a belt drive is:",
        options: {
          a: "Directly proportional to the diameter of both pulleys",
          b: "Directly proportional to the diameter of the driving pulley and inversely proportional to the diameter of the driven pulley",
          c: "Inversely proportional to the diameter of the driving pulley and directly proportional to the diameter of the driven pulley",
          d: "Directly proportional to the speed of the motor"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 20,
        text: "Which thermodynamic parameter remains constant during an ideal reversible adiabatic (isentropic) process?",
        options: {
          a: "Temperature",
          b: "Entropy",
          c: "Enthalpy",
          d: "Volume"
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
    durationMinutes: 40,
    passcode: "CS2024",
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
      },
      {
        id: 11,
        text: "In compiler design, syntax analysis is also widely known as:",
        options: {
          a: "Lexical analysis",
          b: "Parsing",
          c: "Semantic analysis",
          d: "Code generation"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 12,
        text: "Which of the following CPU scheduling algorithms can potentially lead to starvation?",
        options: {
          a: "Round Robin (RR)",
          b: "Priority Scheduling",
          c: "First-Come First-Served (FCFS)",
          d: "Shortest Remaining Time First (SRTF) only"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 13,
        text: "What is the average time complexity of searching for an element in a balanced Binary Search Tree (BST)?",
        options: {
          a: "O(n)",
          b: "O(log n)",
          c: "O(n log n)",
          d: "O(1)"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 14,
        text: "Which design pattern is used to restrict a class to have only a single active instance throughout the application execution?",
        options: {
          a: "Factory Pattern",
          b: "Singleton Pattern",
          c: "Observer Pattern",
          d: "Strategy Pattern"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 15,
        text: "In computer networks, what is the primary role of the DHCP protocol?",
        options: {
          a: "To resolve hostnames to IP addresses",
          b: "To automatically assign IP addresses to devices on a network",
          c: "To monitor bandwidth usage",
          d: "To route packets between different subnets"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 16,
        text: "Which CPU register holds the address of the next instruction to be fetched and executed?",
        options: {
          a: "Instruction Register (IR)",
          b: "Program Counter (PC)",
          c: "Accumulator (AC)",
          d: "Memory Address Register (MAR)"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 17,
        text: "In software engineering, what is the main purpose of regression testing?",
        options: {
          a: "To test the performance of the system under heavy load",
          b: "To ensure that recent code modifications have not broke or regressed existing features",
          c: "To verify database connections",
          d: "To write unit tests for new modules"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 18,
        text: "Which type of grammar is typically used by compilers for syntax analysis?",
        options: {
          a: "Regular grammar",
          b: "Context-free grammar",
          c: "Context-sensitive grammar",
          d: "Unrestricted grammar"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 19,
        text: "What is the primary function of a foreign key in a relational database?",
        options: {
          a: "To speed up search queries",
          b: "To uniquely identify each record in a table",
          c: "To establish a link or relationship between two tables",
          d: "To encrypt sensitive columns"
        },
        correctAnswer: "c",
        points: 1.0
      },
      {
        id: 20,
        text: "In complexity theory, the class P consists of decision problems that can be solved by a deterministic Turing machine in:",
        options: {
          a: "Logarithmic time",
          b: "Polynomial time",
          c: "Exponential time",
          d: "Linear time"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  },
  {
    id: "it-2024",
    title: "Model Exit Exam for Information Technology 2024",
    department: "Information Technology",
    durationMinutes: 40,
    passcode: "IT2024",
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
      },
      {
        id: 11,
        text: "In HTML, which tag is used to embed an image into the document?",
        options: {
          a: "<link>",
          b: "<img>",
          c: "<picture>",
          d: "<src>"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 12,
        text: "Which port does HTTPS use by default for secure communication?",
        options: {
          a: "80",
          b: "443",
          c: "21",
          d: "8080"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 13,
        text: "What is the primary storage medium used in a Solid State Drive (SSD)?",
        options: {
          a: "Magnetic disk platters",
          b: "Flash memory",
          c: "Optical storage",
          d: "Volatile DRAM"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 14,
        text: "Which of the following is an open-source operating system?",
        options: {
          a: "Windows 11",
          b: "Linux",
          c: "macOS",
          d: "iOS"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 15,
        text: "In cybersecurity, what does the term 'Phishing' refer to?",
        options: {
          a: "A technical attack that targets system hardware directly",
          b: "A social engineering attack designed to trick users into revealing sensitive data",
          c: "An attack that encrypts the user's hard drive for ransom",
          d: "Flooding a network router with fake traffic packets"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 16,
        text: "What does XML stand for?",
        options: {
          a: "eXcellent Markup Language",
          b: "eXtensible Markup Language",
          c: "eXtra Modern Link",
          d: "eXternal Media Layout"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 17,
        text: "In databases, what does NoSQL stand for?",
        options: {
          a: "Number of SQL statements",
          b: "Not Only SQL",
          c: "No Schema Query Language",
          d: "Node Structured Query Language"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 18,
        text: "What is the default subnet mask for a Class C IP address?",
        options: {
          a: "255.0.0.0",
          b: "255.255.255.0",
          c: "255.255.0.0",
          d: "255.255.255.255"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 19,
        text: "Which network topology connects all devices directly to a single central cable?",
        options: {
          a: "Star topology",
          b: "Bus topology",
          c: "Ring topology",
          d: "Mesh topology"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 20,
        text: "In cloud computing and virtualization, what is a hypervisor?",
        options: {
          a: "A high-performance hardware processor",
          b: "Software that creates, runs, and manages virtual machines",
          c: "A network router that directs VM traffic",
          d: "A server side firewall"
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
    durationMinutes: 40,
    passcode: "ENG2024",
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
      },
      {
        id: 11,
        text: "Select the word that is opposite (antonym) in meaning to 'vague'.",
        options: {
          a: "Unclear",
          b: "Clear",
          c: "Dull",
          d: "Shy"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 12,
        text: "Choose the grammatically correct sentence from the following options:",
        options: {
          a: "Neither of the boys have finished their homework.",
          b: "Neither of the boys has finished his homework.",
          c: "Neither of the boys have finished his homework.",
          d: "Neither of the boys has finished their homework."
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 13,
        text: "What is the meaning of the common idiom 'spill the beans'?",
        options: {
          a: "To drop food on the floor",
          b: "To reveal secret information prematurely",
          c: "To work extremely hard",
          d: "To make a big mistake"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 14,
        text: "Identify the misspelled word from the options below:",
        options: {
          a: "Receive",
          b: "Tommorrow",
          c: "Believe",
          d: "Weird"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 15,
        text: "In academic writing, a thesis statement is typically located in the:",
        options: {
          a: "Conclusion",
          b: "Introduction",
          c: "Body paragraphs",
          d: "Bibliography"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 16,
        text: "What part of speech is 'under' in the sentence: 'The keys are under the book'?",
        options: {
          a: "Adverb",
          b: "Preposition",
          c: "Conjunction",
          d: "Pronoun"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 17,
        text: "Complete the sentence: 'If it rains tomorrow, we ____ cancel the game.'",
        options: {
          a: "would have",
          b: "will",
          c: "should have been",
          d: "had to"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 18,
        text: "Choose the closest synonym for 'elated':",
        options: {
          a: "Angry",
          b: "Extremely happy",
          c: "Tired",
          d: "Worried"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 19,
        text: "What is a stanza in poetry?",
        options: {
          a: "A line of metrical writing",
          b: "A group of lines forming a unit in a poem",
          c: "The rhythm or beat of a verse",
          d: "A recurring rhyme pattern"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 20,
        text: "In English grammar, what is a gerund?",
        options: {
          a: "A helping verb",
          b: "A verb form ending in -ing that functions as a noun",
          c: "An adjective that modifies a pronoun",
          d: "A punctuation mark"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  }
];
