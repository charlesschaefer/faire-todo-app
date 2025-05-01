Testes de otimização de tempo de compilação do rust
===================================================


## 1. Re-compilando, com 8 threads:

```bash
time cargo build --no-default-features -Zthreads=8
```
>    `660.71s user 78.16s system 588% cpu 2:05.52 total` da primeira vez que rodei
> 
>    `1153.50s user 130.50s system 617% cpu 3:27.88 total` da seguda vez

### 1.1. Pré-compilado, com 8 threads (editei um arquivo):

```bash
time cargo build --no-default-features ## após rodar a compilação acima
```
>    `10.25s user 5.31s system 194% cpu 7.988 total`


## 2. Re-compilado, usando o mold:

```bash
time cargo build --no-default-features
```
>    `1178.89s user 144.21s system 625% cpu 3:31.55 total`

### 2.1. Pré-compilado, usando o mold:

```bash
time cargo build --no-default-features
```
>    `3.95s user 3.37s system 73% cpu 9.928 total`


## 3. Re-compilando, usando o cranelift no nightly:

```bash
time cargo build --no-default-features
```
>    `538.79s user 67.01s system 440% cpu 2:17.62 total`

### 3.1. Pré-compilado, usando o cranelift no nightly:

```bash
time cargo build --no-default-features
```
>    `3.27s user 2.19s system 85% cpu 6.378 total`


## 4. Re-compilando, com opt-level alterado (dev=1, packages=3):

```bash
time cargo build --no-default-features
```
>    `4173.50s user 207.98s system 626% cpu 11:39.01 total`

### 4.1. Pré-compilado, com opt-level alterado (dev=1, packages=3):

```bash
time cargo build --no-default-features
```
>    `2.73s user 1.86s system 86% cpu 5.304 total`


## 5. Re-compilando, com o cache do sccache:

```bash
time cargo build --no-default-features
```
>    `1607.33s user 82.61s system 374% cpu 7:31.47 total`

### 5.1. Pré-compilado, com o cache do sccache:

```bash
time cargo build --no-default-features
```
>    `4.40s user 2.43s system 87% cpu 7.849 total`


## 6. Re-compilando, com codegen-units = 100

```bash
time cargo build --no-default-features
```
>    `1472.51s user 75.98s system 283% cpu 9:05.83 total` da primeira vez que rodei
> 
>    `1329.47s user 67.78s system 374% cpu 6:12.71 total` da segunda vez

### 6.1. Pré-compilado, com codegen-units = 100

```bash
time cargo build --no-default-features
```
>    `2.81s user 1.82s system 89% cpu 5.164 total`


----------------------


## 7. Resultado final: 


### 7.1. Sem nenhuma otimização, apenas com `-Zthreads=8`


>    `660.71s user 78.16s system 588% cpu 2:05.52 total` da primeira vez que rodei
> 
>    `1153.50s user 130.50s system 617% cpu 3:27.88 total` da seguda vez


### 7.2. Com as demais otimizações juntas

**Habilitando junto:**

- `-Zthreads=8`
- cache do `sccache`
- Linking com o `mold`
- Codegen do `cranelift`
- `opt-level = 1` para dev e `3` para pacotes


>    `1472.51s user 75.98s system 283% cpu 9:05.83 total` da primeira vez que rodei
> 
>    `1329.47s user 67.78s system 374% cpu 6:12.71 total` da segunda vez

