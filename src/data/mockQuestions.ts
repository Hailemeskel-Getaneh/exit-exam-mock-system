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
    id: "math-2026",
    title: "Model Exit Exam for Mathematics 2026",
    department: "Mathematics",
    durationMinutes: 40,
    passcode: "1234",
    questions: [
      {
        id: 1,
        text: "What is the derivative of f(x) = x² with respect to x?",
        options: {
          a: "x",
          b: "2x",
          c: "x²",
          d: "2"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 2,
        text: "Solve for x in the linear equation: 2x + 5 = 15.",
        options: {
          a: "5",
          b: "10",
          c: "7.5",
          d: "4"
        },
        correctAnswer: "a",
        points: 1.0
      },
      {
        id: 3,
        text: "What is the value of log₁₀(100)?",
        options: {
          a: "1",
          b: "2",
          c: "10",
          d: "100"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 4,
        text: "The sum of the interior angles of a triangle is always:",
        options: {
          a: "90 degrees",
          b: "180 degrees",
          c: "270 degrees",
          d: "360 degrees"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 5,
        text: "If matrix A has dimensions 2x3 and matrix B has dimensions 3x4, what are the dimensions of the product matrix AB?",
        options: {
          a: "3x3",
          b: "2x4",
          c: "3x4",
          d: "2x3"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 6,
        text: "Find the limit of (sin x) / x as x approaches 0.",
        options: {
          a: "0",
          b: "1",
          c: "Infinity",
          d: "Undefined"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 7,
        text: "What is the value of 5! (5 factorial)?",
        options: {
          a: "24",
          b: "120",
          c: "60",
          d: "720"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 8,
        text: "Which of the following is a prime number?",
        options: {
          a: "15",
          b: "17",
          c: "21",
          d: "9"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 9,
        text: "What is the area of a circle with radius r?",
        options: {
          a: "2 * pi * r",
          b: "pi * r²",
          c: "pi * d",
          d: "2 * pi * r²"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 10,
        text: "If two events A and B are independent, the joint probability P(A and B) is calculated as:",
        options: {
          a: "P(A) + P(B)",
          b: "P(A) * P(B)",
          c: "P(A) / P(B)",
          d: "P(A) - P(B)"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 11,
        text: "What is the exact value of cos(pi)?",
        options: {
          a: "0",
          b: "-1",
          c: "1",
          d: "0.5"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 12,
        text: "Find the derivative of ln(x) with respect to x.",
        options: {
          a: "e^x",
          b: "1/x",
          c: "x",
          d: "1"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 13,
        text: "If the discriminant of a quadratic equation (b² - 4ac) is negative, the roots of the equation are:",
        options: {
          a: "Real and equal",
          b: "Complex conjugate roots",
          c: "Real and unequal",
          d: "Rational and equal"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 14,
        text: "In statistics, what is the middle value of a sorted data set called?",
        options: {
          a: "Mean",
          b: "Median",
          c: "Mode",
          d: "Variance"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 15,
        text: "What is the slope of the straight line represented by the equation y = 3x - 7?",
        options: {
          a: "-7",
          b: "3",
          c: "7",
          d: "-3"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 16,
        text: "Which of the following is the correct definition of a rational number?",
        options: {
          a: "A number that cannot be written as a fraction",
          b: "A number that can be expressed as a ratio p/q of two integers where q is not zero",
          c: "A number containing a square root",
          d: "Any imaginary number"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 17,
        text: "What is the indefinite integral of 1/x dx (for x > 0)?",
        options: {
          a: "-1/x² + C",
          b: "ln(x) + C",
          c: "x + C",
          d: "e^x + C"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 18,
        text: "If a fair coin is tossed twice, what is the probability of getting heads on both tosses?",
        options: {
          a: "0.5",
          b: "0.25",
          c: "0.75",
          d: "0.125"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 19,
        text: "The Pythagorean theorem (a² + b² = c²) applies to which type of triangle?",
        options: {
          a: "Equilateral triangle",
          b: "Right-angled triangle",
          c: "Isosceles triangle",
          d: "Obtuse triangle"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 20,
        text: "What is the exact value of sin(pi/2)?",
        options: {
          a: "0",
          b: "1",
          c: "-1",
          d: "0.5"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 21,
        text: "What is the limit of (1 - cos x) / x as x approaches 0?",
        options: {
          a: "1",
          b: "0",
          c: "Undefined",
          d: "-1"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 22,
        text: "What is the derivative of f(x) = e^(3x) with respect to x?",
        options: {
          a: "e^(3x)",
          b: "3e^(3x)",
          c: "3x * e^(3x-1)",
          d: "1/3 * e^(3x)"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 23,
        text: "In a right-angled triangle, if the adjacent side is 3 and the opposite side is 4, what is the length of the hypotenuse?",
        options: {
          a: "6",
          b: "5",
          c: "7",
          d: "8"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 24,
        text: "Which of the following is a solution to the quadratic equation: x² - 5x + 6 = 0?",
        options: {
          a: "1",
          b: "3",
          c: "5",
          d: "-2"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 25,
        text: "What is the probability of rolling a sum of 7 with two fair six-sided dice?",
        options: {
          a: "1/12",
          b: "1/6",
          c: "1/36",
          d: "5/36"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  },
  {
    id: "science-2026",
    title: "Model Exit Exam for General Science 2026",
    department: "General Science",
    durationMinutes: 40,
    passcode: "1234",
    questions: [
      {
        id: 1,
        text: "What is the chemical symbol for water?",
        options: {
          a: "CO2",
          b: "H2O",
          c: "O2",
          d: "NaCl"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 2,
        text: "Which planet in our solar system is commonly referred to as the Red Planet?",
        options: {
          a: "Venus",
          b: "Mars",
          c: "Jupiter",
          d: "Saturn"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 3,
        text: "What is the basic structural and functional unit of life?",
        options: {
          a: "Tissue",
          b: "Cell",
          c: "Organ",
          d: "Protein"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 4,
        text: "Which gas do green plants primarily absorb from the atmosphere during photosynthesis?",
        options: {
          a: "Oxygen",
          b: "Carbon Dioxide",
          c: "Nitrogen",
          d: "Hydrogen"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 5,
        text: "What is the approximate acceleration due to gravity on the surface of the Earth?",
        options: {
          a: "5.5 m/s²",
          b: "9.8 m/s²",
          c: "12.0 m/s²",
          d: "3.2 m/s²"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 6,
        text: "What is the hardest naturally occurring substance on Earth?",
        options: {
          a: "Gold",
          b: "Diamond",
          c: "Iron",
          d: "Quartz"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 7,
        text: "Which organ in the human body is responsible for pumping blood throughout the circulatory system?",
        options: {
          a: "Lungs",
          b: "Heart",
          c: "Liver",
          d: "Kidneys"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 8,
        text: "What is the primary source of energy for Earth's ecosystem?",
        options: {
          a: "Geothermal heat",
          b: "The Sun",
          c: "Wind energy",
          d: "Fossil fuels"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 9,
        text: "Which gas makes up the largest percentage of Earth's atmosphere?",
        options: {
          a: "Oxygen",
          b: "Nitrogen",
          c: "Carbon Dioxide",
          d: "Argon"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 10,
        text: "What is the boiling point of pure water at standard sea-level atmospheric pressure?",
        options: {
          a: "50 degrees Celsius",
          b: "100 degrees Celsius",
          c: "212 degrees Celsius",
          d: "0 degrees Celsius"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 11,
        text: "Which fundamental force keeps planets in orbit around the Sun?",
        options: {
          a: "Electromagnetic force",
          b: "Gravitational force",
          c: "Strong nuclear force",
          d: "Weak nuclear force"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 12,
        text: "What is the main physiological function of red blood cells?",
        options: {
          a: "To fight infections",
          b: "To transport oxygen throughout the body",
          c: "To help in blood clotting",
          d: "To digest nutrients"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 13,
        text: "What type of energy is stored inside a common chemical battery?",
        options: {
          a: "Thermal energy",
          b: "Chemical energy",
          c: "Kinetic energy",
          d: "Nuclear energy"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 14,
        text: "Which color of visible light has the shortest wavelength?",
        options: {
          a: "Red",
          b: "Violet",
          c: "Green",
          d: "Yellow"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 15,
        text: "What is the dense central region of an atom called?",
        options: {
          a: "Electron cloud",
          b: "Nucleus",
          c: "Proton shell",
          d: "Neutron ring"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 16,
        text: "What is the physical process of a liquid changing into a gas called?",
        options: {
          a: "Condensation",
          b: "Evaporation",
          c: "Sublimation",
          d: "Freezing"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 17,
        text: "Which vitamin is synthesized by the human body when the skin is exposed to direct sunlight?",
        options: {
          a: "Vitamin C",
          b: "Vitamin D",
          c: "Vitamin A",
          d: "Vitamin B12"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 18,
        text: "What is the pH level of pure, neutral water at room temperature?",
        options: {
          a: "5",
          b: "7",
          c: "9",
          d: "14"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 19,
        text: "Which scientific instrument is used to measure atmospheric pressure?",
        options: {
          a: "Thermometer",
          b: "Barometer",
          c: "Anemometer",
          d: "Hygrometer"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 20,
        text: "What is the approximate speed of light in a vacuum?",
        options: {
          a: "3,000 km/s",
          b: "300,000 km/s",
          c: "30,000 km/s",
          d: "3,000,000 km/s"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 21,
        text: "Which component of blood is primarily responsible for clotting?",
        options: {
          a: "Red blood cells",
          b: "Platelets",
          c: "White blood cells",
          d: "Plasma"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 22,
        text: "What is the main gas responsible for the greenhouse effect on Earth?",
        options: {
          a: "Oxygen",
          b: "Carbon Dioxide",
          c: "Nitrogen",
          d: "Helium"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 23,
        text: "Which layer of the Earth's atmosphere contains the ozone layer?",
        options: {
          a: "Troposphere",
          b: "Stratosphere",
          c: "Mesosphere",
          d: "Thermosphere"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 24,
        text: "What type of lens is used to correct nearsightedness (myopia)?",
        options: {
          a: "Convex lens",
          b: "Concave lens",
          c: "Bifocal lens",
          d: "Cylindrical lens"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 25,
        text: "What is the chemical formula for table salt?",
        options: {
          a: "H2O",
          b: "NaCl",
          c: "CO2",
          d: "HCl"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  },
  {
    id: "it-2026",
    title: "Model Exit Exam for Information Technology 2026",
    department: "Information Technology",
    durationMinutes: 40,
    passcode: "1234",
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
      },
      {
        id: 21,
        text: "In object-oriented programming, what is the term used to describe a template or blueprint for creating objects?",
        options: {
          a: "Method",
          b: "Class",
          c: "Interface",
          d: "Attribute"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 22,
        text: "Which port is typically used for standard, unencrypted web traffic (HTTP)?",
        options: {
          a: "443",
          b: "80",
          c: "21",
          d: "25"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 23,
        text: "What is the binary representation of the decimal number 12?",
        options: {
          a: "1010",
          b: "1100",
          c: "1110",
          d: "1001"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 24,
        text: "Which type of database relationship is established when a primary key of one table is referenced as a column in another table?",
        options: {
          a: "Many-to-Many",
          b: "One-to-Many",
          c: "One-to-One",
          d: "Self-referencing"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 25,
        text: "What is the primary purpose of DNS (Domain Name System)?",
        options: {
          a: "To encrypt network data transfers",
          b: "To translate human-readable domain names to numerical IP addresses",
          c: "To filter malicious web pages",
          d: "To assign dynamic IP addresses to devices"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  },
  {
    id: "english-2026",
    title: "Model Exit Exam for English Language 2026",
    department: "English",
    durationMinutes: 40,
    passcode: "1234",
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
      },
      {
        id: 21,
        text: "Identify the subordinating conjunction in the following sentence: 'We stayed indoors because it was raining.'",
        options: {
          a: "indoors",
          b: "because",
          c: "stayed",
          d: "raining"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 22,
        text: "What is the meaning of the prefix 'un-' in words like 'unhappy' and 'unusual'?",
        options: {
          a: "Again",
          b: "Not",
          c: "Before",
          d: "Very"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 23,
        text: "Which of the following sentences contains an intransitive verb (a verb that does not take a direct object)?",
        options: {
          a: "She reads a book every night.",
          b: "The train arrived on time.",
          c: "He wrote a beautiful letter.",
          d: "They bought a new car."
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 24,
        text: "Identify the figure of speech used in this sentence: 'The wind whispered secrets through the trees.'",
        options: {
          a: "Simile",
          b: "Personification",
          c: "Metaphor",
          d: "Hyperbole"
        },
        correctAnswer: "b",
        points: 1.0
      },
      {
        id: 25,
        text: "What is the correct plural form of the singular noun 'criterion'?",
        options: {
          a: "criterions",
          b: "criteria",
          c: "criterias",
          d: "criteri"
        },
        correctAnswer: "b",
        points: 1.0
      }
    ]
  }
];
