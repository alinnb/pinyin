import grade1vol1 from "./1-1.json";

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
    // Add more volumes here
    default:
      return [];
  }
};

export const getAvailableVolumes = () => {
  return [
    { id: "grade-1-vol-1", name: "语文一年级上册" },
    // Future volumes
    // { id: 'grade-1-vol-2', name: '语文一年级下册' },
  ];
};
