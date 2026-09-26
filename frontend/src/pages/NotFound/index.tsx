import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, StatePanel } from "../../components/ui";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/** Unknown URLs used to render an empty page with no header, no message and no way back. */
export function NotFoundPage() {
  useDocumentTitle("Page not found");
  const navigate = useNavigate();
  return (
    <Card>
      <StatePanel
        icon={<Compass size={24} />}
        title="We can't find that page"
        description="The link may be old, or the page may have moved."
        action={
          <Button type="button" variant="primary" onClick={() => navigate("/")}>
            Go to pull requests
          </Button>
        }
      />
    </Card>
  );
}
