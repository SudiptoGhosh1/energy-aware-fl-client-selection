"""Optional ML link: FedAvg (softmax regression, numpy) on a non-IID split of sklearn's
8x8 digits data (a stand-in for MNIST - no internet access in the sandbox).
Data groups = digit classes.  Client k holds exactly the classes with h[k,g]=1."""
import numpy as np
from sklearn.datasets import load_digits


def load_data(seed=0):
    d = load_digits()
    X = d.data / 16.0
    y = d.target
    rng = np.random.default_rng(seed)
    idx = rng.permutation(len(y))
    n_test = 500
    te, tr = idx[:n_test], idx[n_test:]
    return X[tr], y[tr], X[te], y[te]


def partition(inst, Xtr, ytr, seed=0):
    """Give every client samples of its own classes; samples of a class are split among holders."""
    rng = np.random.default_rng(seed)
    parts = [[] for _ in range(inst.K)]
    for g in range(inst.G):
        holders = np.where(inst.h[:, g])[0]
        if len(holders) == 0:
            continue
        ids = rng.permutation(np.where(ytr == g)[0])
        for c, chunk in enumerate(np.array_split(ids, len(holders))):
            parts[holders[c]].extend(chunk.tolist())
    return [np.array(p, dtype=int) for p in parts]


def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    ez = np.exp(z)
    return ez / ez.sum(axis=1, keepdims=True)


def local_train(W, X, y, n_classes, epochs=2, lr=0.5, batch=16, rng=None):
    W = W.copy()
    n = len(y)
    for _ in range(epochs):
        order = rng.permutation(n)
        for i in range(0, n, batch):
            b = order[i:i + batch]
            Xb = np.hstack([X[b], np.ones((len(b), 1))])
            P = softmax(Xb @ W)
            P[np.arange(len(b)), y[b]] -= 1
            W -= lr * Xb.T @ P / len(b)
    return W


def accuracy(W, X, y):
    Xb = np.hstack([X, np.ones((len(y), 1))])
    return float((np.argmax(Xb @ W, axis=1) == y).mean())


def run_fedavg(inst, X_sel, data, seed=0):
    """X_sel: (K,R) selection matrix. Returns accuracy after each round."""
    Xtr, ytr, Xte, yte = data
    parts = partition(inst, Xtr, ytr, seed)
    rng = np.random.default_rng(seed)
    W = np.zeros((Xtr.shape[1] + 1, inst.G))
    accs = []
    for t in range(inst.R):
        sel = [k for k in np.where(X_sel[:, t] == 1)[0] if len(parts[k]) > 0]
        if sel:
            Ws, ns = [], []
            for k in sel:
                Ws.append(local_train(W, Xtr[parts[k]], ytr[parts[k]], inst.G, rng=rng))
                ns.append(len(parts[k]))
            ns = np.array(ns, float)
            W = sum(wk * (n / ns.sum()) for wk, n in zip(Ws, ns))
        accs.append(accuracy(W, Xte, yte))
    return accs
