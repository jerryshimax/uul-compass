import { getPeople } from "@/lib/data";
import { PeopleContent } from "./people-content";

export default async function PeoplePage() {
  const people = await getPeople();
  return <PeopleContent people={people} />;
}
