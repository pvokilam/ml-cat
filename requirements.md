Absolutely! Here’s a **complete technical specification** for an iOS grocery app feature that covers both **category classification** and **auto-complete/suggestion**, using an **on-device ML approach**. I’ve structured it to be clear, actionable, and beginner-friendly.

---

# Technical Specification: Grocery Item Categorization & Auto-Complete

## 1. Overview

**Objective:**
Implement an **on-device system** that automatically assigns a **grocery category** to user-input items and provides **real-time auto-complete suggestions**, fully offline, and **language-independent**.

**Features:**

1. **Category classification:** Assigns a store category (Dairy, Produce, Bakery, etc.) to a user-entered item.
2. **Auto-complete / suggestions:** Suggests grocery items while the user is typing.

**Constraints:**

* Runs fully **offline**
* **Language-independent** (multilingual)
* Low latency (<10ms for embedding, <2ms for search)
* Easily maintainable & extendable
* Small storage footprint (<25MB total for ML + data)

---

## 2. Architecture Overview

### 2.1 Components

| Component                               | Function                                                                | Storage / Size |
| --------------------------------------- | ----------------------------------------------------------------------- | -------------- |
| **Multilingual Text Encoder (Core ML)** | Converts input text to embedding vectors                                | ~20 MB         |
| **Local Grocery Item Database**         | Stores example items, embeddings, categories                            | ~1–2 MB        |
| **Nearest Neighbor Search Engine**      | Finds closest precomputed embeddings for categorization and suggestions | negligible     |
| **Category Mapper**                     | Maps nearest neighbor(s) to category (majority vote)                    | negligible     |
| **Auto-complete Manager**               | Returns top-N item suggestions based on similarity or prefix match      | negligible     |

### 2.2 Data Flow

#### Category Classification

```
User Input Text
      ↓
Text Encoder → Embedding Vector
      ↓
Nearest Neighbor Search → Top-K Closest Items
      ↓
Majority Vote → Predicted Category
```

#### Auto-complete

```
User Input Text (partial)
      ↓
Text Encoder → Embedding Vector
      ↓
Nearest Neighbor Search → Top-N Closest Items
      ↓
Optional prefix filtering → Final Suggestions List
```

---

## 3. Data Preparation

### 3.1 Grocery Categories

* Define a **fixed set of store categories**. Example:

  ```
  Produce, Dairy, Bakery, Meat & Seafood, Pantry, Frozen, Snacks, Beverages, Household, Personal Care, Pet Supplies, Other
  ```

### 3.2 Example Grocery Items

* For each category, collect **diverse examples** (short phrases or brand names)
* Prefer **semantic diversity** over quantity
* Target ~20–50 items per category

Example JSON structure:

```json
{
  "Dairy": ["milk", "cheese", "yogurt", "butter", "kefir"],
  "Produce": ["apple", "banana", "spinach", "tomato"],
  "Bakery": ["bread", "bagel", "croissant"]
}
```

### 3.3 Precompute Embeddings

* Run one-time preprocessing script on Mac:

  * Input: text of each example
  * Output: normalized embedding vector + category
* Store in binary or JSON file in app bundle

```swift
struct ItemEmbedding {
    let name: String
    let vector: [Float]   // normalized
    let category: Category
}
```

---

## 4. On-Device Pipeline

### 4.1 Category Classification

1. **Encode user input**

```swift
let inputVector = encoder.encode(userText)
```

2. **Find nearest neighbors**

```swift
let neighbors = findNearest(query: inputVector, items: storedItems, k: 5)
```

3. **Determine category**

```swift
let category = majorityVote(neighbors)
if bestScore < threshold { return .other }
```

---

### 4.2 Auto-Complete / Suggestions

1. **Short input (<3 chars)**

   * Use **prefix search** over stored items

2. **Long input (≥3 chars)**

   * Encode input → embedding
   * Find nearest neighbors in embedding space
   * Rank suggestions by similarity
   * Optional: boost items matching predicted category

3. **Return top-N suggestions**

```swift
let suggestions = neighbors.prefix(5).map { $0.name }
```

---

## 5. Nearest Neighbor Engine

* **Similarity metric:** Cosine similarity
* **Computation:** Dot product of normalized vectors
* **Optimization:**

  * Pre-normalize stored vectors
  * Debounce input to reduce computation
  * Small vector set (<1000 items) → linear scan sufficient
* **Future scaling:** Consider HNSW or KD-tree for 10k+ items

---

## 6. User Personalization

* If user corrects a category or selects a suggestion:

  * Store new item and embedding locally
  * Update nearest neighbor search in memory
  * No model retraining required

---

## 7. Performance & Storage

| Step                                 | Time (ms) |
| ------------------------------------ | --------- |
| Embedding computation                | 5–10      |
| Nearest neighbor search (≤500 items) | <2        |
| Total latency                        | ~10–12    |

**Storage footprint:**

* Core ML model: ~20 MB
* Embedding database: ~1–2 MB
* Total: ~22 MB

---

## 8. Error Handling / Edge Cases

* **Unknown or low-confidence items:** Return `.Other` category
* **Ambiguous items:** Show multiple suggestions in auto-complete
* **Typos / misspellings:** Embedding similarity handles most errors
* **Multi-language input:** Handled by multilingual embedding model

---

## 9. Optional Enhancements

1. **Category-aware suggestions:** Boost items matching predicted category
2. **Popularity weighting:** Rank frequently used items higher
3. **Hybrid search:** Combine prefix + embedding similarity
4. **Local learning:** Add user-typed items dynamically to database

---

## 10. Advantages of This Approach

* Fully offline and privacy-friendly
* Language-independent
* Easy to maintain and update
* Supports user personalization
* Works for new/unseen items via semantic similarity
* Fast and lightweight

---

## 11. Summary

* Use **pre-trained multilingual embedding model** → generates vectors from text
* Store **example grocery items with category labels** and their vectors
* **Category classification:** nearest neighbor + majority vote
* **Auto-complete:** nearest neighbor search + optional prefix filtering
* Supports **multilingual input, typos, and unseen items**
* Fully **on-device**, low-latency, easily maintainable

---

Got it — you want something **lightweight (~10 MB), proven, on-device friendly, multilingual, and ready to use**.

Here’s a practical breakdown.

---

# 1️⃣ Recommended Embedding Model

### **`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`**

**Why it fits your needs:**

| Feature         | Details                                                        |
| --------------- | -------------------------------------------------------------- |
| **Size**        | ~20 MB PyTorch / ~10–12 MB Core ML optimized                   |
| **Languages**   | 50+ languages                                                  |
| **Accuracy**    | Good semantic similarity for short phrases                     |
| **Performance** | Fast on mobile, uses 384-dim vectors                           |
| **Proven**      | Widely used in production for embeddings and similarity search |

> Note: Core ML conversion can reduce size and make it faster on-device.

---

# 2️⃣ Alternative Lightweight Options

If you absolutely need **<10 MB**, you could consider:

| Model                                 | Size     | Notes                           |
| ------------------------------------- | -------- | ------------------------------- |
| **MiniLM-L6-v2 (multilingual)**       | ~7–10 MB | Slightly less accurate than L12 |
| **distiluse-base-multilingual-cased** | ~10 MB   | Good balance of quality & size  |

---

# 3️⃣ Why Not Use Large Models?

* Large models like LaBSE (~400 MB) or MPNet (~100 MB+) are **too heavy for mobile**.
* They do improve semantic accuracy slightly but **not worth the storage or latency cost** for grocery categorization.

---

# 4️⃣ On-Device Implementation Notes

1. Convert the model to **Core ML** using `coremltools`.

   * Reduces size
   * Optimized for Apple Neural Engine (ANE)
   * Runs offline

2. Use **384-dim embeddings** (MiniLM default).

   * Enough for distinguishing grocery items
   * Memory footprint: 500–1000 items × 384 floats ≈ <1 MB

3. Normalize embeddings once.

   * Speeds up cosine similarity
   * Standard practice for nearest-neighbor search

---

# 5️⃣ Suggested Pipeline Using This Model

```
User Input Text → Core ML MiniLM L12 → 384-dim Embedding
       ↓
Nearest neighbor search vs stored item embeddings
       ↓
Category prediction / Auto-complete suggestions
```

---

# 6️⃣ Summary Recommendation

* **Use:** `paraphrase-multilingual-MiniLM-L12-v2`
* **Why:** Lightweight, proven, multilingual, fast on iOS
* **Size:** ~10–12 MB after Core ML conversion
* **Vector dimension:** 384 floats
* **Storage impact for 500–1000 items:** <2 MB

