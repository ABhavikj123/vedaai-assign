"use client";

import type { GeneratedPaper } from "@/src/types/assignment";

export function PaperPreview({ paper }: { paper: GeneratedPaper }) {
  return (
    <article className="rounded-[28px] bg-white px-5 py-8 font-action shadow-sm md:px-12 md:py-12">
      <header className="text-center">
        <h1 className="font-display text-[24px] font-extrabold md:text-[34px]">{paper?.schoolName}</h1>
        <p className="mt-2 font-display text-[18px] font-bold md:text-[24px]">Subject: {paper?.subject}</p>
        <p className="mt-1 font-display text-[18px] font-bold md:text-[23px]">Class: {paper?.class}</p>
      </header>

      <div className="mt-8 flex flex-col gap-3 font-display text-[16px] font-bold md:flex-row md:justify-between md:text-[20px]">
        <p>Time Allowed: {paper?.timeAllowedMinutes} minutes</p>
        <p>Maximum Marks: {paper?.maximumMarks}</p>
      </div>

      <div className="mt-8 space-y-2 font-display text-[16px] font-bold">
        {(paper?.generalInstructions ?? []).map((instruction, idx) => (
          <p key={idx}>{instruction}</p>
        ))}
      </div>

      <div className="mt-8 grid gap-2 font-display text-[15px] font-bold md:w-[360px]">
        <label className="flex items-end gap-1">
          Name:
          <input className="min-w-0 flex-1 border-b border-[#303030] bg-transparent outline-none" aria-label="Student name" />
        </label>
        <label className="flex items-end gap-1">
          Roll Number:
          <input className="min-w-0 flex-1 border-b border-[#303030] bg-transparent outline-none" aria-label="Roll number" />
        </label>
        <label className="flex items-end gap-1">
          Section:
          <input className="min-w-0 flex-1 border-b border-[#303030] bg-transparent outline-none" aria-label="Section" />
        </label>
      </div>

      <div className="mt-10 space-y-12">
        {(paper?.sections ?? []).map((section) => (
          <section key={section.sectionLetter}>
            <h2 className="text-center font-display text-[22px] font-extrabold md:text-[28px]">
              Section {section.sectionLetter}
            </h2>
            <div className="mt-8">
              <h3 className="font-display text-[17px] font-bold md:text-[20px]">{section.sectionTitle}</h3>
              <p className="mt-1 italic text-[#444]">{section.sectionInstruction}</p>
              <ol className="mt-7 space-y-6">
                {(section.questions ?? []).map((question, index) => (
                  <li key={question.id || index} className="grid gap-2">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                      <div className="flex gap-2 leading-7">
                        <span>{index + 1}.</span>
                        <div>
                          <span>{question.questionText}</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#f4f4f4] px-3 py-1 text-sm font-bold shrink-0">
                        {question.marks} Marks
                      </span>
                    </div>

                    {question.diagramSvg && (
                      <div 
                        className="mt-3 w-full max-w-xl mx-auto p-4 bg-white rounded-2xl border border-neutral-200 shadow-inner overflow-x-auto flex justify-center items-center"
                        dangerouslySetInnerHTML={{ __html: question.diagramSvg }} 
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 font-display font-extrabold">End of Question Paper</p>

      <section className="mt-12">
        <h2 className="font-display text-[22px] font-extrabold">Answer Key:</h2>
        <ol className="mt-5 list-decimal space-y-4 pl-5 leading-7">
          {(paper?.answerKey ?? []).map((answer, index) => (
            <li key={answer.questionId || index}>{answer.answerText}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}