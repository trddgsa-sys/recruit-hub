import { Badge } from '@/components/ui/Badge';
import { stageLabel } from '@/lib/utils';

const stageVariant: Record<string, 'default' | 'info' | 'warning' | 'purple' | 'danger' | 'success'> = {
  APPLIED:              'info',
  UNDER_REVIEW:         'warning',
  SHORTLISTED:          'purple',
  INTERVIEW_SCHEDULED:  'default',
  OFFER_SENT:           'warning',
  HIRED:                'success',
  REJECTED:             'danger',
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant={stageVariant[stage] ?? 'default'}>
      {stageLabel(stage)}
    </Badge>
  );
}
