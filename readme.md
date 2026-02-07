# Passeio Virtual 3D em WebGL (FPS)

Este projeto é um **Passeio Virtual 3D em WebGL**, desenvolvido como trabalho da disciplina de **Computação Gráfica** da **Universidade Estadual do Ceará (UECE)**.

O sistema simula um ambiente 3D navegável com movimentação em primeira pessoa (FPS), utilizando **WebGL puro** (sem bibliotecas como Three.js), com suporte a texturas, iluminação Phong e animações.

**Autor:** Francisco Crispim Pinto Uchôa Neto  
**Universidade:** Universidade Estadual do Ceará (UECE)  
**Disciplina:** Computação Gráfica  

---

## 🎮 1. Apresentação do Passeio Virtual

O passeio virtual permite ao usuário explorar um cenário 3D interativo com movimentação estilo FPS.

### Controles

- `W A S D` → movimentação  
- `Mouse` → olhar ao redor  
- `Shift` → correr  
- `Space` → pular  
- `ESC` → libera o mouse do canvas  

### Recursos implementados

- Câmera em primeira pessoa (FPS)  
- Projeção perspectiva  
- Iluminação Phong (ambiente + difusa + especular)  
- Texturas aplicadas em objetos do cenário  
- Luz dinâmica em movimento  
- Objeto animado (cubo vermelho flutuando e rotacionando)  

---

## ⚙️ 2. Como instalar e rodar (Linux e Windows)

### Requisitos

Você precisa apenas de um navegador moderno com suporte a WebGL, como:

- Google Chrome  
- Firefox  
- Microsoft Edge  

> ⚠️ Importante:  
> Como o projeto carrega imagens (texturas), abrir diretamente com `file://` pode causar erro de CORS.  
> O recomendado é rodar usando um servidor local simples.

---

## 🐧 Rodando no Linux

### Opção 1: Python (recomendado)

```bash
cd pasta-do-projeto
python3 -m http.server 8000
# Depois abra no navegador:
# http://localhost:8000
```

### Opção 2: Node.js (http-server)

```bash
npm install -g http-server
cd pasta-do-projeto
http-server
# Abra o endereço exibido no terminal, por exemplo:
# http://127.0.0.1:8080
```

---

## 🪟 Rodando no Windows

### Opção 1: Python (recomendado)

```bash
cd pasta-do-projeto
python -m http.server 8000
# Depois abra no navegador:
# http://localhost:8000
```

### Opção 2: Node.js (http-server)

```bash
npm install -g http-server
cd pasta-do-projeto
http-server
# Depois abra o link exibido no terminal
```

---

## 🎯 Como jogar

Após abrir no navegador:

1. Clique no canvas para ativar o jogo.  
2. O mouse ficará travado no canvas (Pointer Lock).  
3. Use os controles:
   - `WASD` para andar  
   - `Mouse` para controlar a visão  
   - `Shift` para correr  
   - `Space` para pular  
4. Para liberar o mouse, pressione `ESC`.  

---

## 📄 3. Documentação breve

### 📁 Estrutura do Projeto

- **index.html**  
  Página principal contendo o canvas WebGL e os shaders (GLSL).  

- **main.js**  
  Contém a lógica principal do motor:
  - criação da cena  
  - controle FPS  
  - carregamento de texturas  
  - animações e renderização  

- **math.js**  
  Funções matemáticas para matrizes e vetores (transformações 3D).  

---

## 🎥 Pipeline de Renderização

O projeto segue o pipeline padrão do WebGL:

1. Configuração do contexto WebGL  
2. Compilação dos shaders (vertex + fragment)  
3. Criação dos buffers (vértices, normais e UVs)  
4. Carregamento de texturas  
5. Loop principal com `requestAnimationFrame`  
6. Atualização de câmera, luz e animações  
7. Renderização dos objetos na GPU  

---

## 🧠 Requisitos Implementados

- ✅ Projeção Perspectiva  
- ✅ Câmera FPS (Primeira Pessoa)  
- ✅ Pointer Lock API  
- ✅ Física Simples (pulo e gravidade)  
- ✅ Iluminação Phong  
- ✅ Luz dinâmica em movimento  
- ✅ Texturas aplicadas no cenário  
- ✅ Objetos com cor sólida  
- ✅ Objeto animado  

> 📌 Observação:  
> Este projeto **não utiliza importação de modelos `.OBJ`**.  
> Toda a geometria foi criada manualmente no código, utilizando cubos e planos.

---

## 📚 Créditos

Trabalho desenvolvido para a disciplina **Computação Gráfica**  
Universidade Estadual do Ceará (UECE)  

**Autor:** Francisco Crispim Pinto Uchôa Neto