import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Stats from "@/components/Stats";
import SellerBlock from "@/components/SellerBlock";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <ProductGrid />
      <Stats />
      <SellerBlock />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  );
}
