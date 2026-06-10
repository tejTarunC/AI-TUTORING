# AI Study Assistant: Project Documentation & Goals

This document serves as the permanent record for the **QA Learning Program** (AI Study Assistant). It captures the project's inception, technical implementation, and future trajectory.

---

## 1. Project Vision
A local-first, privacy-conscious learning application that allows users to master complex topics through iterative testing. It leverages Generative AI (Gemini) to create increasingly difficult challenges based on existing performance.

### Key Objectives:
- **Local-First**: Data (tests, history, notes) is stored locally in JSON format.
- **AI-Augmented**: Integrated prompt generation to facilitate "Deep Learning" by increasing test hardness.
- **Iterative Feedback**: Track progress over time and provide a space for personal reflections (notes).

---

## 2. Current Architecture

### Frontend (React + TypeScript + Vite)
- **Styling**: Tailwind CSS 4 with a custom "Glassmorphism" design system.
- **State Management**: React Hooks (useState/useEffect) for view routing and test logic.
- **Icons**: Lucide-React.
- **API Client**: Axios for backend communication.

### Backend (Node.js + Express + TypeScript)
- **Runtime**: ts-node-dev for seamless development.
- **Persistence**: File-system based (FS promises) using the `data/` directory.
- **Endpoints**:
  - `GET /api/tests`: List all available test modules.
  - `GET /api/tests/:filename`: Fetch specific test content.
  - `POST /api/history/:testId`: Record an assessment attempt.
  - `GET /api/history/:testId`: Retrieve attempt history.
  - `POST /api/notes/:testId`: Save post-test reflections.

### Data Schema
- **Tests**: JSON files containing questions, multiple choices, and correct answers.
- **History**: Record of scores, time taken, and specific answers given.
- **Notes**: Textual reflections linked to specific tests.

---

## 3. Implementation History (June 10, 2026)

1.  **Phase 1 & 2 (Setup & Backend)**: Established the directory structure and built the Express API to handle local file operations.
2.  **Phase 3 (Frontend Core)**: Developed the three main views (Home, Test, Results) and wired them to the backend.
3.  **Phase 4 (AI Integration)**: Built the "Increase Hardness" prompt generator.
4.  **Phase 5 (UI Redesign)**: Transitioned from a basic text interface to a high-polish, interactive Glassmorphism UI.
5.  **Phase 6 (Automation)**: Created a `start.sh` script and a Zsh alias (`tutoring`) for a one-command development environment.

---

## 4. Areas for Improvement (Future Goals)

### Technical Enhancements
- [ ] **Automated AI Integration**: Directly call the Gemini API instead of generating a prompt for manual copy-pasting.
- [ ] **Test Creation Tool**: A UI for creating and editing tests manually within the app.
- [ ] **Data Visualization**: Graphs and charts to show score trends over time on the Home screen.
- [ ] **File Upload**: Drag-and-drop JSON files into the browser to add new tests.

### User Experience (UX)
- [ ] **Timed Challenges**: Option to set a strict time limit per test.
- [ ] **Sound Effects**: Subtle audio feedback for correct/incorrect answers.
- [ ] **Category Filtering**: Group tests by topic (e.g., Programming, History, Science).
- [ ] **Multi-Select Answers**: Support for questions with more than one correct answer.

---

## 5. How to Resume Work
- **Start Command**: Type `tutoring` in your terminal.
- **Add New Content**: Place any valid JSON test file into `data/tests/`.
- **Backend Port**: 3001
- **Frontend Port**: 5173

---
*Last Updated: June 10, 2026*


I want you to create a project, 
the project will be a AI_TUTORING program. 

I'm learning new topics everyday and as to practice the concepts I need you to generate the questions for me. 
the questions will be Q&A with multiple choices. 
there can be one or multiple correct answers to each question. 

you write a project with what ever stack(node js, react js, type script, python, java, it doesn't matter, choose the language that best fits this goal) you can think of. 


the project should intake a Json file and the load the questions in my browser. everything needed will be present in local. 
the json file will looks like below sample. 

{
  "test": [
    {
      "question": "",
      "mutliple_choices": [
        "option1",
        "option2",
        "option3",
        "option4",
        "option5"
      ],
      "answer": "a,b,c"
    },
    {
      "question": "",
      "mutliple_choices": [
        "option1",
        "option2",
        "option3",
        "option4",
        "option5"
      ],
      "answer": "a,b,c"
    }
  ]
}

so the flow will look like this.
I ask you to generate questions for a particular topic I'm intrested in. lets say kafka. 
you will generate me the questions and answers in above format. so prepare me the proper query to use everytime I use the applications.
genrate questions will be saved some where the projects called tests. this tests directory will have all files which you have genrated in past as well. 

when the application is ready, one tab will open in the browser. 
it will show me list of questionariees which we have generated. then I should be able to click the test I want to take. 
I will take the test and answer the questions. once I submit after answering all the questions. 
you will udpate the screen to high light what questions are right and what are wrong and show me the score and time taken.
this will be saved in test history. I should be able to retake the test again. when I choose to check the history using see history button . I should be able to check it. 
it should be how much time was taken, how many questions I got right etc. 

now lets say we have generated a test for CAP fundamentals. 
I have taken the test. Now I might need new questions to train on it. these questions will be harded than the old ones.
so in the home page. 
when you show me list of questionarries we have genreated, there will be a button which says increase hardness. when I click you just show me precomputed promt by updating the place holders in it. the query should be like 
generate new questions of the ${topic} and reference to old questions will be present. 
I copy this string using copy option on UI and paste it in gemini cli or gemini web page. It will give me new json document. which I store in the respective directory you tell me. and when I refresh the page, this will take effect. 

so home page will look like 
Questionariies:
1. CAP FUNDAMENTALS
    1) generated on DATE - 3/10 hardness
    2) genreated on DATE - 5/10 hardness
2. AVRO ENCODING
    1) generated on DATE - 3/10 hardness
    2) genreated on DATE - 5/10 hardness

all these are clickable tests. 

so when I submit with all my answers and the questions which are wrong will have copy button. which will let me copy the questions and paste it in browser/ gemini web page to learn why I'm wrong. Each test will have page called notes. when I submit the page. I should be able to write some thing and save it for future.


