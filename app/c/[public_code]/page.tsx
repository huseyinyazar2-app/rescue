import { FinderPage } from "./FinderPage";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: { public_code: string } }) => {
  return FinderPage({ publicCode: params.public_code, defaultEventType: "seen" });
};

export default Page;
