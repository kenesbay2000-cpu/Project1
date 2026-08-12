export type GuideHighlight = {
  title: string;
  text: string;
  tag: string;
};

export type GuideBudgetItem = {
  label: string;
  value: string;
  note: string;
};

export type GuideNote = {
  title: string;
  text: string;
};

export type DestinationGuide = {
  lead: string;
  intro: string[];
  highlights: GuideHighlight[];
  bestTime: string;
  climate: string;
  entry: string;
  entrySource: { label: string; url: string };
  budget: GuideBudgetItem[];
  essentials: { label: string; value: string }[];
  cautions: GuideNote[];
  culture: string[];
};
