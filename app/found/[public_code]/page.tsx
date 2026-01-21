import { FinderPage } from "@/app/c/[public_code]/FinderPage";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: { public_code: string } }) => {
  return FinderPage({ publicCode: params.public_code, defaultEventType: "found" });
};

export default Page;
