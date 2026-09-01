import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import Versions from "@/components/Versions";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-4">
      <h3 className="p-2">Welcome Home!</h3>
      <Versions />
      <Badge>Default</Badge>
      <div className="flex flex-col">
        <Link to="/examples/form" className="ml-2 text-blue-500 underline">
          Go to Form Example
        </Link>
        <ModeToggle />
      </div>
    </div>
  );
}
