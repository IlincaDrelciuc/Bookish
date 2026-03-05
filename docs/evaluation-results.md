# Evaluation Results

## Methodology
Hit@50 evaluation across 198 test users sampled from the Goodbooks-10k dataset.
Each user had at least 5 books matched in the database. One highly-rated book
(4-5 stars) was hidden per user and the algorithm was tested on whether it
appeared in the top 50 recommendations.

## Results

| Variant | Algorithm | Hits | Hit@50 |
|---------|-----------|------|--------|
| A | Genre overlap + popularity weighting | 5 | 2.53% |
| B | Genre overlap + popularity + author bonus | 5 | 2.53% |

Improvement V2 over V1: 0.0%

## Discussion

SQL Variant A achieved a Hit@50 of 2.53% across 198 test users sampled from
the Goodbooks-10k dataset. SQL Variant B, which added a +20 author familiarity
bonus to the scoring function, also achieved a Hit@50 of 2.53%. The identical
scores indicate that the author bonus did not improve recommendation recall for
this dataset, likely because users in the test set had read too few books by
any single author for the bonus to activate meaningfully.

The modest Hit@50 score reflects a known limitation of content-based filtering:
with only 20 genres, genre overlap is a coarse signal that matches a large
portion of the catalogue, making it difficult to identify a specific held-out
book in the top 50. This result motivates the inclusion of the Gemini AI layer,
which incorporates richer semantic signals — plot themes, writing style, and
mood — that go beyond genre matching and are expected to produce more precise
personalised recommendations.