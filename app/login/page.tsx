import Navbar from "../../components/Navbar";
import AuthCard from "../../components/AuthCard";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#0b0618] to-[#120b2a]">
            <Navbar />

            <div className="flex flex-1 items-center justify-center px-4">
                <AuthCard />
            </div>
        </main>
    );
}
