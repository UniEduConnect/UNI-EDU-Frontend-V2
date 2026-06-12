import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UniHome from "@/pages/UniHome";
import ChatWidget from "@/components/ChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background landing">
      <Header />
      <HeroSection />
      <UniHome />
      <ChatWidget />
    </div>
  );
};

export default Index;
