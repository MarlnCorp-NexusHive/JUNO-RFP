import React from "react";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-xl shadow text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">Unauthorized</h1>
        <p className="text-muted-foreground mb-4">You do not have access to a dashboard or this section.<br/>Please contact your administrator if you believe this is a mistake.</p>
        <a href="/login" className="text-primary font-semibold hover:underline">Back to Login</a>
      </div>
    </div>
  );
} 