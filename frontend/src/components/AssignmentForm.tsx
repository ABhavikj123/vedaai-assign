"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/src/components/Icon";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";

const questionTypes = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Long Answer Questions",
  "Case Study Questions"
];

export function AssignmentForm() {
  const router = useRouter();

  const formState = useAssignmentStore((state) => state.formState);
  const loading = useAssignmentStore((state) => state.loading);

  const setFormField = useAssignmentStore((state) => state.setFormField);
  const setQuestionTypeRow = useAssignmentStore(
    (state) => state.setQuestionTypeRow
  );
  const addQuestionTypeRow = useAssignmentStore(
    (state) => state.addQuestionTypeRow
  );
  const removeQuestionTypeRow = useAssignmentStore(
    (state) => state.removeQuestionTypeRow
  );
  const submitAssignmentForm = useAssignmentStore(
    (state) => state.submitAssignmentForm
  );

  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const totals = useMemo(
    () =>
      formState.questionTypes.reduce(
        (acc, row) => ({
          questions: acc.questions + row.count,
          marks: acc.marks + row.count * row.marks
        }),
        { questions: 0, marks: 0 }
      ),
    [formState.questionTypes]
  );

  const submit = async () => {
    setLocalError(null);
    setFieldErrors([]);

    const missingFields: string[] = [];

    if (!formState.title.trim()) {
      missingFields.push("Assignment Title");
    }

    if (!formState.subject.trim()) {
      missingFields.push("Subject");
    }

    if (!formState.className.trim()) {
      missingFields.push("Class");
    }

    if (!formState.timeAllowedMinutes) {
      missingFields.push("Time");
    }

    if (!formState.dueDate) {
      missingFields.push("Due Date");
    }

    const hasFile = !!formState.file;
    const hasInstructions = !!formState.instructions.trim();

    if (!hasFile && !hasInstructions) {
      missingFields.push(
        "Upload File or Additional Information"
      );
    }

    if (missingFields.length > 0) {
      setFieldErrors(missingFields);

      setLocalError(
        `Please fill required fields`
      );

      return;
    }

    try {
      const assignmentId = await submitAssignmentForm();

      router.push(`/assignments/${assignmentId}/loading`);
    } catch (submitError) {
      setLocalError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create assignment"
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col pb-10">
      <div>
        <div className="flex items-start gap-3">
          <span className="mt-1 h-4 w-4 rounded-full border-[3px] border-[#9BE3B3] bg-[#43C46D]" />

          <div>
            <h1 className="font-display text-[28px] font-extrabold leading-none text-[#2B2B2B]">
              Create Assignment
            </h1>

            <p className="mt-2 font-action text-[15px] text-[#8B8B8B]">
              Set up a new assignment for your students
            </p>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-[760px] gap-2">
          <span className="h-[5px] flex-1 rounded-full bg-[#5B5B5B]" />
          <span className="h-[5px] flex-1 rounded-full bg-[#D9D9D9]" />
        </div>
      </div>

      <section className="mt-8 rounded-[34px] bg-[#F5F5F5] p-5 ring-1 ring-white md:p-8">
        <div className="mx-auto max-w-[860px]">
          <h2 className="font-display text-[26px] font-extrabold text-[#2F2F2F]">
            Assignment Details
          </h2>

          <p className="mt-1 font-action text-[15px] text-[#8B8B8B]">
            Basic information about your assignment
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="md:col-span-3">
              <span className="mb-2 block font-display text-[18px] font-bold text-[#2F2F2F]">
                Assignment Title
              </span>

              <input
                value={formState.title}
                onChange={(event) =>
                  setFormField("title", event.target.value)
                }
                placeholder="Quiz on Electricity"
                className="h-[58px] w-full rounded-full border border-[#DDDDDD] bg-[#FAFAFA] px-6 font-action text-[16px] text-[#2E2E2E] outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block font-display text-[18px] font-bold text-[#2F2F2F]">
                Subject
              </span>

              <input
                value={formState.subject}
                onChange={(event) =>
                  setFormField("subject", event.target.value)
                }
                placeholder="Science"
                className="h-[58px] w-full rounded-full border border-[#DDDDDD] bg-[#FAFAFA] px-6 font-action text-[16px] text-[#2E2E2E] outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block font-display text-[18px] font-bold text-[#2F2F2F]">
                Class
              </span>

              <input
                value={formState.className}
                onChange={(event) =>
                  setFormField("className", event.target.value)
                }
                placeholder="Grade 8"
                className="h-[58px] w-full rounded-full border border-[#DDDDDD] bg-[#FAFAFA] px-6 font-action text-[16px] text-[#2E2E2E] outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block font-display text-[18px] font-bold text-[#2F2F2F]">
                Time
              </span>

              <input
                type="number"
                min={1}
                value={formState.timeAllowedMinutes}
                onChange={(event) =>
                  setFormField(
                    "timeAllowedMinutes",
                    Math.max(1, Number(event.target.value))
                  )
                }
                placeholder="60"
                className="h-[58px] w-full rounded-full border border-[#DDDDDD] bg-[#FAFAFA] px-6 font-action text-[16px] text-[#2E2E2E] outline-none"
              />
            </label>
          </div>

          <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#D0D0D0] bg-[#FAFAFA] px-4 py-10 text-center">
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="sr-only"
              onChange={(event) =>
                setFormField("file", event.target.files?.[0] || null)
              }
            />

            <Icon name="Upload_cloud.svg" alt="" size={34} />

            <span className="mt-5 font-action text-[18px] font-semibold text-[#303030]">
              Choose a file or drag & drop it here
            </span>

            <span className="mt-2 font-action text-[14px] text-[#A2A2A2]">
              PDF, TXT, upto 10MB
            </span>

            <span className="mt-5 rounded-full bg-[#F0F0F0] px-8 py-3 font-action text-[15px] font-semibold text-[#343434]">
              Browse Files
            </span>

            {formState.file ? (
              <span className="mt-4 text-sm text-[#555]">
                {formState.file.name}
              </span>
            ) : null}
          </label>

          <p className="mt-4 text-center font-action text-[16px] text-[#777777]">
            Upload your preferred document or text file
          </p>

          <label className="mt-6 block">
            <span className="font-display text-[18px] font-bold text-[#2E2E2E]">
              Due Date
            </span>

            <div className="relative mt-3">
              <input
                type="date"
                value={formState.dueDate}
                onChange={(event) =>
                  setFormField("dueDate", event.target.value)
                }
                className="h-[58px] w-full rounded-full border border-[#DDDDDD] bg-[#FAFAFA] px-6 pr-14 font-action text-[16px] text-[#555] outline-none"
              />

              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                <Icon name="Calendar_plus.svg" alt="" size={22} />
              </span>
            </div>
          </label>

          <div className="mt-7">
            <div className="px-1">
              <span className="font-display text-[16px] font-bold text-[#2F2F2F] md:hidden">
                Question Type
              </span>

              <div className="hidden grid-cols-[minmax(280px,1fr)_140px_120px] items-center gap-5 md:grid">
                <span className="font-display text-[18px] font-bold text-[#2F2F2F]">
                  Question Type
                </span>

                <span className="text-center font-display text-[18px] font-bold text-[#2F2F2F]">
                  No. of Questions
                </span>

                <span className="text-center font-display text-[18px] font-bold text-[#2F2F2F]">
                  Marks
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {formState.questionTypes.map((row, index) => (
                <div
                  key={`${row.type}-${index}`}
                  className="rounded-[24px] bg-white px-3 py-3 md:grid md:grid-cols-[minmax(280px,1fr)_32px_140px_120px] md:items-center md:gap-5 md:rounded-none md:bg-transparent md:p-0"
                >
                  <div className="flex items-center gap-1">
                    <div className="relative min-w-0 flex-1 rounded-full bg-white">
                      <select
                        value={row.type}
                        onChange={(event) =>
                          setQuestionTypeRow(index, {
                            type: event.target.value
                          })
                        }
                        className="h-[44px] w-full truncate appearance-none bg-transparent pl-4 pr-7 font-action text-[12px] font-medium text-[#2F2F2F] outline-none md:h-[58px] md:rounded-full md:border md:border-[#ECECEC] md:bg-[#FAFAFA] md:px-6 md:pr-14 md:text-[16px]"
                      >
                        {questionTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 md:right-5">
                        <Icon
                          name="chevron_down_symbol.svg"
                          alt=""
                          size={15}
                        />
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestionTypeRow(index)}
                      aria-label="Remove question row"
                      className="grid h-7 w-7 shrink-0 place-items-center md:h-8 md:w-8"
                    >
                      <Icon
                        name="cross_symbol.svg"
                        alt=""
                        size={15}
                      />
                    </button>
                  </div>

                  <div className="hidden md:block" />

                  <div className="mt-2 flex gap-3 rounded-[20px] bg-[#F3F3F3] p-2.5 md:mt-0 md:contents md:rounded-none md:bg-transparent md:p-0">
                    <NumberStepper
                      label="No. of Questions"
                      value={row.count}
                      onChange={(value) =>
                        setQuestionTypeRow(index, {
                          count: value
                        })
                      }
                    />

                    <NumberStepper
                      label="Marks"
                      value={row.marks}
                      onChange={(value) =>
                        setQuestionTypeRow(index, {
                          marks: value
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestionTypeRow}
              className="mt-6 flex items-center gap-3"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#2B2B2B]">
                <Icon
                  name="add_symbol.svg"
                  alt=""
                  size={14}
                  className="brightness-0 invert"
                />
              </span>

              <span className="font-action text-[22px] font-semibold text-[#2D2D2D]">
                Add Question Type
              </span>
            </button>
          </div>

          <div className="mt-8 text-right font-action text-[18px] font-medium text-[#2E2E2E]">
            <p>Total Questions : {totals.questions}</p>
            <p className="mt-1">Total Marks : {totals.marks}</p>
          </div>

          <label className="mt-8 block">
            <span className="font-display text-[18px] font-bold text-[#2F2F2F]">
              Additional Information (For better output)
            </span>

            <div className="relative mt-3">
              <textarea
                value={formState.instructions}
                onChange={(event) =>
                  setFormField("instructions", event.target.value)
                }
                className="min-h-[110px] w-full resize-none rounded-[20px] border border-dashed border-[#D8D8D8] bg-[#FAFAFA] px-5 py-4 pr-16 font-action text-[15px] text-[#2E2E2E] outline-none"
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
              />

              <button
                type="button"
                aria-label="Voice input"
                className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
              >
                <Icon
                  name="Mic.svg"
                  alt=""
                  size={30}
                  className="text-black my-1.5"
                />
              </button>
            </div>
          </label>

          {localError ? (
            <div className="mt-4 rounded-[18px] border border-[#F3B3B3] bg-[#FFF1F1] px-5 py-4">
              <p className="font-action font-semibold text-[#C53535]">
                {localError}
              </p>

              {fieldErrors.length > 0 ? (
                <ul className="mt-3 list-disc pl-5 font-action text-[15px] text-[#C53535]">
                  {fieldErrors.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-[58px] items-center gap-3 rounded-full bg-white px-8 font-action text-[22px] font-medium text-[#2D2D2D]"
        >
          <Icon name="Arrow_Left.svg" alt="" size={18} />
          Previous
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="flex h-[58px] items-center gap-3 rounded-full bg-[#121212] px-8 font-action text-[22px] font-medium text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Next"}

          <Icon
            name="Arrow_Right.svg"
            alt=""
            size={18}
            className="brightness-0 invert"
          />
        </button>
      </div>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="min-w-0 flex-1 md:min-w-[140px]">
      <span className="mb-2 block text-center font-action text-[11px] font-medium text-[#4A4A4A] md:hidden">
        {label}
      </span>

      <div className="grid h-[38px] grid-cols-3 items-center rounded-full bg-white px-3 md:h-[58px] md:border md:border-[#ECECEC] md:bg-[#FAFAFA]">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          aria-label={`Decrease ${label}`}
          className="grid place-items-center"
        >
          <Icon name="Minus.svg" alt="" size={14} className="md:grayscale md:opacity-30" />
        </button>

        <input
          type="number"
          min={1}
          value={value}
          onChange={(event) =>
            onChange(Math.max(1, Number(event.target.value)))
          }
          className="min-w-0 bg-transparent text-center font-action text-[20px] font-semibold text-[#2E2E2E] outline-none md:text-[22px]"
        />

        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="grid place-items-center"
        >
          <Icon
            name="add_symbol.svg"
            alt=""
            size={12}
            className="md:grayscale md:opacity-30"
          />
        </button>
      </div>
    </div>
  );
}
