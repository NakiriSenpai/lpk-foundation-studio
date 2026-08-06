import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/features/media/components/media-picker";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/exam";
import { ANSWER_LABELS, GRAMMAR_TAGS } from "@/features/exam/exam.constants";
import type { AnswerLabel, ExamQuestionWithAnswers, MediaSlot } from "./question-types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  sectionId: string;
  question?: ExamQuestionWithAnswers | null;
};

type AnswerState = {
  label: AnswerLabel;
  text: string;
  image_url: string | null;
  audio_url: string | null;
};

const emptyAnswers = (): AnswerState[] =>
  ANSWER_LABELS.map((label) => ({ label, text: "", image_url: null, audio_url: null }));

export function QuestionFormDialog({
  open,
  onOpenChange,
  examId,
  sectionId,
  question = null,
}: Props) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [grammarTag, setGrammarTag] = useState<string>("pola-kalimat");
  const [explanation, setExplanation] = useState("");
  const [lessonRef, setLessonRef] = useState("");
  const [answers, setAnswers] = useState<AnswerState[]>(emptyAnswers());
  const [correct, setCorrect] = useState<AnswerLabel>("A");
  const [error, setError] = useState<string | null>(null);

  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const pending = createQuestion.isPending || updateQuestion.isPending;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (question) {
      setText(question.text);
      setImageUrl(question.image_url);
      setAudioUrl(question.audio_url);
      setGrammarTag(question.grammar_tag ?? "pola-kalimat");
      setExplanation(question.explanation ?? "");
      setLessonRef(question.lesson_ref ?? "");
      setAnswers(
        ANSWER_LABELS.map((label) => {
          const found = question.answers.find((a) => a.label === label);
          return {
            label,
            text: found?.text ?? "",
            image_url: found?.image_url ?? null,
            audio_url: found?.audio_url ?? null,
          };
        }),
      );
      setCorrect(question.answers.find((a) => a.is_correct)?.label ?? "A");
    } else {
      setText("");
      setImageUrl(null);
      setAudioUrl(null);
      setGrammarTag("pola-kalimat");
      setExplanation("");
      setLessonRef("");
      setAnswers(emptyAnswers());
      setCorrect("A");
    }
  }, [open, question]);

  const setAnswer = (label: AnswerLabel, patch: Partial<AnswerState>) =>
    setAnswers((prev) => prev.map((a) => (a.label === label ? { ...a, ...patch } : a)));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (text.trim().length < 3) return setError("Teks soal minimal 3 karakter.");
    if (!explanation.trim()) return setError("Pembahasan wajib diisi.");
    if (!grammarTag) return setError("Grammar tag wajib dipilih.");

    const filled = answers.filter((a) => a.text.trim() || a.image_url || a.audio_url);
    if (filled.length < 2) return setError("Minimal dua pilihan jawaban harus diisi.");
    const correctFilled = filled.some((a) => a.label === correct);
    if (!correctFilled) return setError("Jawaban benar harus termasuk pilihan yang diisi.");

    const payload = {
      text: text.trim(),
      image_url: imageUrl,
      audio_url: audioUrl,
      grammar_tag: grammarTag,
      explanation: explanation.trim(),
      lesson_ref: lessonRef.trim(),
      answers: answers.map((a) => ({
        label: a.label,
        text: a.text.trim(),
        image_url: a.image_url,
        audio_url: a.audio_url,
        is_correct: a.label === correct,
      })),
    };

    try {
      if (question) {
        await updateQuestion.mutateAsync({ id: question.id, input: payload });
        toast.success("Soal diperbarui.");
      } else {
        await createQuestion.mutateAsync({ examId, sectionId, input: payload });
        toast.success("Soal ditambahkan.");
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const mediaSlot = (
    label: string,
    kind: MediaSlot,
    value: string | null,
    onChange: (url: string | null) => void,
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border p-2 text-xs">
          <span className="min-w-0 flex-1 truncate">{value}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange(null)}>
            Hapus
          </Button>
        </div>
      ) : (
        <MediaPicker
          allowed={[kind]}
          folder="exam"
          label={`Unggah ${label.toLowerCase()}`}
          onChange={(asset) => onChange(asset?.url ?? null)}
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{question ? "Ubah Soal" : "Tambah Soal"}</DialogTitle>
          <DialogDescription>
            Media diunggah melalui Media Foundation. Pembahasan dan grammar tag wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="q-text">Teks Soal</Label>
            <Textarea
              id="q-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pertanyaan di sini."
            />
          </div>

          {mediaSlot("Gambar Soal", "image", imageUrl, setImageUrl)}
          {mediaSlot("Audio Soal", "audio", audioUrl, setAudioUrl)}

          <div className="space-y-3">
            <Label>Pilihan Jawaban</Label>
            <RadioGroup value={correct} onValueChange={(v) => setCorrect(v as AnswerLabel)}>
              {answers.map((answer) => (
                <div key={answer.label} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={answer.label} id={`correct-${answer.label}`} />
                    <Label htmlFor={`correct-${answer.label}`} className="w-6 font-semibold">
                      {answer.label}
                    </Label>
                    <Input
                      value={answer.text}
                      onChange={(e) => setAnswer(answer.label, { text: e.target.value })}
                      placeholder={`Jawaban ${answer.label}`}
                    />
                  </div>
                  {mediaSlot(`Gambar ${answer.label}`, "image", answer.image_url, (url) =>
                    setAnswer(answer.label, { image_url: url }),
                  )}
                  {mediaSlot(`Audio ${answer.label}`, "audio", answer.audio_url, (url) =>
                    setAnswer(answer.label, { audio_url: url }),
                  )}
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Pilih lingkaran di depan huruf untuk menandai jawaban benar.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Grammar Tag</Label>
            <Select value={grammarTag} onValueChange={setGrammarTag}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRAMMAR_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-explanation">Pembahasan</Label>
            <Textarea
              id="q-explanation"
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Jelaskan alasan jawaban benar."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-lesson">Lesson Reference (placeholder)</Label>
            <Input
              id="q-lesson"
              value={lessonRef}
              onChange={(e) => setLessonRef(e.target.value)}
              placeholder="Contoh: materi-partikel-wa"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Simpan Soal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
