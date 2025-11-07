export type Group = {
  title: string;
  names: string[];
  assignments: Record<string, string>; // giver -> receiver
  createdAt: number;
};
