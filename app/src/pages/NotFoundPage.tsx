import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { PageContainer } from "../components/Layout";

export function NotFoundPage() {
  return <PageContainer className="not-found"><span className="section-kicker">404</span><h1>That page wandered off.</h1><p>It may have been archived, or perhaps it was never here.</p><Link to="/"><Button>Back to Milly</Button></Link></PageContainer>;
}
