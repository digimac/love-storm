import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { HelpCircle, CheckCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const needCategories = [
  { value: "meals", label: "🍽️ Meals & food" },
  { value: "transport", label: "🚗 Transportation & rides" },
  { value: "financial", label: "💙 Financial help" },
  { value: "emotional", label: "💛 Emotional support & companionship" },
  { value: "childcare", label: "👶 Childcare" },
  { value: "volunteer", label: "🤝 Volunteer hands" },
  { value: "medical", label: "⚕️ Medical support" },
  { value: "housing", label: "🏠 Housing & shelter" },
  { value: "other", label: "Other" },
];

const urgencyOptions = [
  { value: "critical", label: "Critical — needs help today" },
  { value: "high", label: "High — within a few days" },
  { value: "medium", label: "Medium — this week" },
  { value: "low", label: "Low — flexible timing" },
];

export default function RequestHelp() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    needCategory: "",
    urgency: "medium",
    contactEmail: "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/requests", data),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.location.trim() || !form.needCategory) return;
    mutation.mutate(form);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
        <h1 className="font-display text-xl font-bold mb-2">Request received</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          A Steward will review your request with care and reach out soon. You're not alone in this.
        </p>
        <Button onClick={() => setSubmitted(false)} variant="outline">Submit another request</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={18} className="text-[hsl(15,75%,56%)]" />
          <h1 className="font-display text-xl font-bold">Request a Love Storm</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          Tell us what you need. A trusted Steward will review your request privately and, if appropriate, mobilize the community on your behalf — with your dignity protected at every step.
        </p>
      </div>

      {/* Principles callout */}
      <div className="bg-muted/40 border border-border rounded-xl p-4 mb-7 grid sm:grid-cols-3 gap-3">
        {[
          { title: "Dignity first", body: "Your story is shared with care and only what's needed." },
          { title: "Steward-vetted", body: "Every storm goes through a trusted community leader." },
          { title: "Private by default", body: "Your contact info is never public." },
        ].map(({ title, body }) => (
          <div key={title}>
            <p className="text-xs font-semibold mb-0.5">{title}</p>
            <p className="text-xs text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-request">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Your name <span className="text-muted-foreground font-normal">(optional — can stay anonymous)</span>
          </Label>
          <Input
            id="name"
            placeholder="Or leave blank to stay anonymous"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            data-testid="input-name"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium">
            What's happening? <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your situation and what kind of help would make the most difference. Be as specific as you're comfortable with."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="h-28 resize-none"
            required
            data-testid="input-description"
          />
        </div>

        {/* Location + Need + Urgency in a grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-medium">
              General location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="e.g. East Louisville, KY"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              required
              data-testid="input-location"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="needCategory" className="text-sm font-medium">
              Primary need <span className="text-red-500">*</span>
            </Label>
            <Select value={form.needCategory} onValueChange={v => setForm(f => ({ ...f, needCategory: v }))}>
              <SelectTrigger id="needCategory" data-testid="select-need-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {needCategories.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-1.5">
          <Label htmlFor="urgency" className="text-sm font-medium">How urgent is this?</Label>
          <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
            <SelectTrigger id="urgency" data-testid="select-urgency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {urgencyOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact */}
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail" className="text-sm font-medium">
            Contact email <span className="text-muted-foreground font-normal">(optional — Steward use only)</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="you@example.com"
            value={form.contactEmail}
            onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
            data-testid="input-email"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[hsl(15,75%,56%)] hover:bg-[hsl(15,75%,50%)] text-white font-semibold gap-2"
          disabled={mutation.isPending || !form.description || !form.location || !form.needCategory}
          data-testid="button-submit-request"
        >
          <HelpCircle size={16} />
          {mutation.isPending ? "Submitting…" : "Submit request privately"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Your request goes only to the Steward review queue. Nothing is published without your approval.</p>
      </form>
    </div>
  );
}
