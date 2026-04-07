import { getSalesData } from "@/lib/data";
import { SalesContent } from "./sales-content";

export default function SalesPage() {
  const data = getSalesData();
  return <SalesContent data={data} />;
}
