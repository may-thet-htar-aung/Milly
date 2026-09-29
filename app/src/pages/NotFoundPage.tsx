import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { PageContainer } from "../components/Layout";
import { useI18n } from "../i18n";

export function NotFoundPage() {
  const { t } = useI18n();
  return <PageContainer className="not-found"><span className="section-kicker">{t("notFoundKicker")}</span><h1>{t("wandered")}</h1><p>{t("wanderedBody")}</p><Link to="/"><Button>{t("backMilly")}</Button></Link></PageContainer>;
}
