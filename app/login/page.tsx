import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/AuthCard";

export default function LoginPage() {
    return (
        <AuthLayout>
            <AuthCard mode="login" />
        </AuthLayout>
    );
}
