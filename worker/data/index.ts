import grade1vol1 from "./1-1.json";
import grade1vol2 from "./1-2.json";
import grade2vol1 from "./2-1.json";
import grade2vol2 from "./2-2.json";
import grade3vol1 from "./3-1.json";
import grade3vol2 from "./3-2.json";
import grade4vol1 from "./4-1.json";
import grade4vol1b from "./4-1b.json";
import grade4vol2 from "./4-2.json";
import grade4vol2b from "./4-2b.json";
import grade5vol1 from "./5-1.json";
import grade5vol1b from "./5-1b.json";
import grade5vol2 from "./5-2.json";
import grade5vol2b from "./5-2b.json";

export interface Article {
  volume: string;
  lesson: string;
  content: string[];
}

// In a real app with R2/D1, this would be an async fetch
export const getVolumeData = (volumeId: string): Article[] => {
  switch (volumeId) {
    case "grade-1-vol-1":
      return grade1vol1 as Article[];
    case "grade-1-vol-2":
      return grade1vol2 as Article[];
    case "grade-2-vol-1":
      return grade2vol1 as Article[];
    case "grade-2-vol-2":
      return grade2vol2 as Article[];
    case "grade-3-vol-1":
      return grade3vol1 as Article[];
    case "grade-3-vol-2":
      return grade3vol2 as Article[];
    case "grade-4-vol-1":
      return [...(grade4vol1 as Article[]), ...(grade4vol1b as Article[])];
    case "grade-4-vol-2":
      return [...(grade4vol2 as Article[]), ...(grade4vol2b as Article[])];
    case "grade-5-vol-1":
      return [...(grade5vol1 as Article[]), ...(grade5vol1b as Article[])];
    case "grade-5-vol-2":
      return [...(grade5vol2 as Article[]), ...(grade5vol2b as Article[])];
    default:
      return [];
  }
};

export const getAvailableVolumes = () => {
  return [
    { id: "grade-1-vol-1", name: "语文一年级上册" },
    { id: "grade-1-vol-2", name: "语文一年级下册" },
    { id: "grade-2-vol-1", name: "语文二年级上册" },
    { id: "grade-2-vol-2", name: "语文二年级下册" },
    { id: "grade-3-vol-1", name: "语文三年级上册" },
    { id: "grade-3-vol-2", name: "语文三年级下册" },
    { id: "grade-4-vol-1", name: "语文四年级上册" },
    { id: "grade-4-vol-2", name: "语文四年级下册" },
    { id: "grade-5-vol-1", name: "语文五年级上册" },
    { id: "grade-5-vol-2", name: "语文五年级下册" },
  ];
};
