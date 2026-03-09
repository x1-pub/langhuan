export interface WelcomeHomeCopy {
  start: string;
  question: string;
  text1: string;
  text2: string;
  text3: string;
  d2: string;
  story1: string;
  story2: string;
  support: string;
  ready: string;
  startNow: string;
  freeNow: string;
  github: string;
  meta: {
    license: string;
    engines: string;
    availability: string;
  };
  shell: {
    title: string;
    tabWorkspace: string;
    tabAgent: string;
    tabDeploy: string;
    hint: string;
    assistant: string;
    you: string;
    message1: string;
    message2: string;
    status: string;
  };
}

export interface WelcomeEngineCard {
  key: string;
  name: string;
  description: string;
  tags: string[];
  className: string;
}
