import { useState } from 'react';
import { Star, Pencil, Trash2, CheckCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useGetProductReviews,
  useGetMyReview,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  type Review,
} from '@/services/review.service';

interface ReviewSectionProps {
  productId: number;
  isAuthenticated: boolean;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'size-6 transition-colors',
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size === 'sm' ? 'size-4' : 'size-3',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

function RatingSummary({ reviews }: { reviews: { rating: number }[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="flex gap-6 items-center mb-6">
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold">{avg.toFixed(1)}</p>
        <StarDisplay rating={avg} />
        <p className="text-xs text-muted-foreground mt-1">{reviews.length} avis</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {dist.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right">{star}</span>
            <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="w-4 text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({
  productId,
  existing,
  onCancel,
}: {
  productId: number;
  existing?: Pick<Review, 'id' | 'rating' | 'comment'> | null;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');

  const { mutate: create, isPending: creating } = useCreateReview(productId);
  const { mutate: update, isPending: updating } = useUpdateReview(productId);
  const isPending = creating || updating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error('Veuillez choisir une note'); return; }
    if (!comment.trim()) { toast.error('Veuillez écrire un commentaire'); return; }

    if (existing) {
      update(
        { id: existing.id, rating, comment },
        {
          onSuccess: () => { toast.success('Avis modifié'); onCancel?.(); },
          onError: () => toast.error('Erreur lors de la modification'),
        }
      );
    } else {
      create(
        { product: productId, rating, comment },
        {
          onSuccess: () => toast.success('Merci pour votre avis !'),
          onError: (err: any) =>
            toast.error(err?.response?.data?.error || 'Erreur lors de l\'envoi'),
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-muted/30 rounded-lg p-4 border">
      <p className="font-medium text-sm">{existing ? 'Modifier votre avis' : 'Votre avis'}</p>

      <div className="space-y-1">
        <Label className="text-xs">Note *</Label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="review-comment" className="text-xs">Commentaire *</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="size-3 animate-spin mr-1.5" />}
          {existing ? 'Modifier' : 'Publier'}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}

function ReviewCard({
  review,
  isOwn,
  onEdit,
  onDelete,
}: {
  review: Review;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const date = new Date(review.created_at).toLocaleDateString('fr-SN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-2 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {review.user_avatar ? (
            <img src={review.user_avatar} alt={review.user_name} className="size-8 rounded-full object-cover" />
          ) : (
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <User className="size-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{review.user_name}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>

        {isOwn && (
          <div className="flex items-center gap-1 shrink-0">
            {confirming ? (
              <>
                <span className="text-xs text-muted-foreground mr-1">Supprimer ?</span>
                <Button size="sm" variant="destructive" className="h-6 px-2 text-xs" onClick={() => { setConfirming(false); onDelete(); }}>
                  Oui
                </Button>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setConfirming(false)}>
                  Non
                </Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="ghost" className="size-7" onClick={onEdit}>
                  <Pencil className="size-3" />
                </Button>
                <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                  <Trash2 className="size-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <StarDisplay rating={review.rating} />
        {review.is_verified_purchase && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle className="size-3" /> Achat vérifié
          </span>
        )}
      </div>

      {review.title && <p className="text-sm font-medium">{review.title}</p>}
      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
    </div>
  );
}

export function ReviewSection({ productId, isAuthenticated }: ReviewSectionProps) {
  const { data: reviews = [], isLoading } = useGetProductReviews(productId);
  const { data: myReview } = useGetMyReview(productId, isAuthenticated);
  const { mutate: deleteReview } = useDeleteReview(productId);
  const [editing, setEditing] = useState(false);

  const handleDelete = () => {
    if (!myReview) return;
    deleteReview(myReview.id, {
      onSuccess: () => toast.success('Avis supprimé'),
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Avis clients</h2>

      {/* Résumé des notes */}
      {reviews.length > 0 && <RatingSummary reviews={reviews} />}

      {/* Formulaire d'ajout / modification */}
      {isAuthenticated && !myReview && (
        <ReviewForm productId={productId} />
      )}

      {isAuthenticated && myReview && editing && (
        <ReviewForm
          productId={productId}
          existing={myReview}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Liste des avis */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          Aucun avis pour le moment. Soyez le premier à donner votre avis !
        </p>
      ) : (
        <div className="divide-y">
          {reviews.map((review) => {
            const isOwn = myReview?.id === review.id;
            return (
              <ReviewCard
                key={review.id}
                review={review}
                isOwn={isOwn}
                onEdit={() => setEditing(true)}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* Invitation à se connecter */}
      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Connectez-vous pour laisser un avis.
        </p>
      )}
    </div>
  );
}
