# Concepts

## What is RPC?

RPC (Remote Procedure Call) is a protocol enabling a computer program to run code on a remote server. It facilitates inter-process communication, letting a client call a function on a server as if it were local.

```ts
// HTTP/REST
const res = await fetch('/api/users/1');
const user = await res.json();
//    ^? const user: any

// RPC
const user = await api.users.getById({ id: 1 });
//    ^? const user: { id: number, name: string, email: string }
```
