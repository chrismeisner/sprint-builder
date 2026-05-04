export interface DemoTodoItem {
  id: string;
  title: string;
  subtitle: string;
  type: "setup" | "near-term" | "long-horizon";
  vehicleId: string;
  vehicleLabel: string;
}

export const DEMO_TODOS: DemoTodoItem[] = [
  {
    id: "insurance",
    title: "Upload insurance card",
    subtitle: "Needed for roadside assistance",
    type: "setup",
    vehicleId: "civic",
    vehicleLabel: "Civic",
  },
  {
    id: "oil",
    title: "Oil change due",
    subtitle: "May 12 or ~800 mi, whichever comes first",
    type: "near-term",
    vehicleId: "rav4",
    vehicleLabel: "RAV4",
  },
  {
    id: "coolant",
    title: "Coolant flush at 50,000 mi",
    subtitle: "~12,800 mi away",
    type: "long-horizon",
    vehicleId: "civic",
    vehicleLabel: "Civic",
  },
];
