import type { FormEvent } from 'react';
import type { ClarificationQuestion, PlannerRequest } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';

type PlannerConversationProps = {
  request: PlannerRequest;
  questions: ClarificationQuestion[];
  answer: string;
  stage: 'idle' | 'analyzing' | 'summarizing' | 'generating';
  error: string;
  onAnswerChange: (answer: string) => void;
  onAnswer: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onRetry: () => void;
};

function AiMessage({ questions }: { questions: ClarificationQuestion[] }) {
  const { t } = useI18n();
  return (
    <div className="planner-dialog__message planner-dialog__message--ai">
      <span className="planner-dialog__avatar">AI</span>
      <div>
        <strong>{t('dialog.intro')}</strong>
        <ol>{questions.map((question) => <li key={question.id}>{question.text}</li>)}</ol>
      </div>
    </div>
  );
}

export function PlannerConversation(props: PlannerConversationProps) {
  const { t } = useI18n();
  const { request, questions, answer, stage, error, onAnswerChange, onAnswer, onReset, onRetry } = props;
  return (
    <section className="planner-dialog" aria-label={t('dialog.aria')}>
      <div className="planner-dialog__messages" aria-live="polite">
        <div className="planner-dialog__message planner-dialog__message--user"><div>{request.prompt}</div></div>
        {request.clarifications?.map((turn, index) => (
          <div className="planner-dialog__turn" key={`${turn.questions[0]?.id}-${index}`}>
            <AiMessage questions={turn.questions} />
            <div className="planner-dialog__message planner-dialog__message--user"><div>{turn.answer}</div></div>
          </div>
        ))}
        {questions.length > 0 && <AiMessage questions={questions} />}
        {stage !== 'idle' && (
          <div className="planner-dialog__message planner-dialog__message--ai planner-dialog__typing">
            <span className="planner-dialog__avatar">AI</span>
            <div><strong>{stage === 'analyzing' ? t('dialog.analyzing') : stage === 'summarizing' ? t('dialog.summarizing') : t('dialog.generating')}</strong><span><i /><i /><i /></span></div>
          </div>
        )}
      </div>

      {error && <div className="planner-form__error" role="alert">{error}</div>}
      {questions.length > 0 && stage === 'idle' && (
        <form className="planner-dialog__reply" onSubmit={onAnswer}>
          <label htmlFor="planner-reply">{t('dialog.answer')}</label>
          <textarea id="planner-reply" required maxLength={4000} rows={4} value={answer} onChange={(event) => onAnswerChange(event.target.value)} placeholder={t('dialog.answerPlaceholder')} autoFocus />
          <button type="submit">{t('dialog.continue')} <span>→</span></button>
        </form>
      )}
      <div className="planner-dialog__footer">
        {error && questions.length === 0 && stage === 'idle' && <button type="button" className="planner-dialog__retry" onClick={onRetry}>{t('dialog.retry')}</button>}
        <button type="button" className="planner-dialog__reset" disabled={stage !== 'idle'} onClick={onReset}>{t('dialog.reset')}</button>
      </div>
    </section>
  );
}
