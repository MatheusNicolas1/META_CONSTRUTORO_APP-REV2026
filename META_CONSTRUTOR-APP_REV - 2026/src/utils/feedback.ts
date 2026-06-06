export type FeedbackFormData = {
  title: string;
  type: string;
  rating: string;
  message: string;
};

export const buildFeedbackRequestBody = (formData: FeedbackFormData) => ({
  title: formData.title,
  type: formData.type,
  rating: formData.rating ? Number(formData.rating) : undefined,
  message: formData.message,
});
