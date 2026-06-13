# 📚 Guía Básica de Git para Equipos de Desarrollo

> Esta guía establece el flujo de trabajo recomendado para el equipo de desarrollo, incluyendo el uso de Git, la creación de ramas, commits, Pull Requests y una guía básica de Code Review.

---

# 📑 Tabla de Contenidos

1. ¿Qué es Git?
2. Configuración inicial
3. Clonar un repositorio
4. Estado del repositorio
5. Trabajar con ramas
6. Actualizar una rama
7. Guardar cambios (Commit)
8. Subir cambios (Push)
9. Descargar cambios (Pull)
10. Crear un Pull Request
11. Code Review
12. Convención de commits
13. Convención de nombres de ramas
14. Flujo de trabajo recomendado
15. Buenas prácticas
16. Comandos más utilizados

---

# 📖 ¿Qué es Git?

Git es un sistema de control de versiones que permite trabajar en equipo de forma organizada, mantener un historial de cambios y colaborar sin sobrescribir el trabajo de otros desarrolladores.

---

# ⚙️ Configuración inicial

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "correo@empresa.com"
```

Ver configuración:

```bash
git config --list
```

---

# 📥 Clonar un repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar al proyecto:

```bash
cd nombre-del-proyecto
```

---

# 📋 Estado del repositorio

Ver el estado actual:

```bash
git status
```

Ver cambios realizados:

```bash
git diff
```

---

# 🌿 Trabajar con ramas

Ver ramas:

```bash
git branch
```

Crear una nueva rama:

```bash
git checkout -b feature/nueva-funcionalidad
```

Cambiar de rama:

```bash
git checkout develop
```

Eliminar una rama local:

```bash
git branch -d feature/nueva-funcionalidad
```

---

# 🔄 Actualizar una rama

Antes de iniciar una nueva tarea:

```bash
git checkout develop
git pull origin develop
```

Volver a tu rama:

```bash
git checkout feature/nueva-funcionalidad
```

Actualizarla:

```bash
git merge develop
```

---

# 💾 Guardar cambios

Agregar archivos:

```bash
git add .
```

Crear commit:

```bash
git commit -m "feat: agregar nueva funcionalidad"
```

---

# 🚀 Subir cambios

Primer envío:

```bash
git push -u origin feature/nueva-funcionalidad
```

Siguientes envíos:

```bash
git push
```

---

# 📥 Descargar cambios

```bash
git pull
```

O desde una rama específica:

```bash
git pull origin develop
```

---

# 🔀 Crear un Pull Request

Una vez terminada la funcionalidad:

1. Verifica que tu rama esté actualizada.
2. Sube los últimos cambios con `git push`.
3. Crea un Pull Request hacia `develop` o `main`.
4. Agrega un título descriptivo.
5. Describe brevemente los cambios realizados.
6. Solicita la revisión del equipo.
7. Espera la aprobación antes de hacer el Merge.

---

# 👀 Code Review

El **Code Review** consiste en revisar el código de otro integrante antes de integrarlo al proyecto.

Su objetivo es detectar errores, mejorar la calidad del código y compartir conocimiento dentro del equipo.

## ✅ ¿Qué revisar?

* El código cumple con el requerimiento solicitado.
* El proyecto compila correctamente.
* No existen errores evidentes.
* Los nombres de variables y métodos son claros.
* No hay código comentado o innecesario.
* No existe lógica duplicada.
* El código es fácil de leer y mantener.
* No se agregaron archivos innecesarios (`bin`, `obj`, `node_modules`, etc.).
* Se realizaron pruebas básicas.

---

## 💬 Ejemplos de comentarios útiles

✅ Correcto:

> ¿Podríamos reutilizar este método para evitar duplicar lógica?

> Sería conveniente validar que el objeto no sea `null` antes de utilizarlo.

> Excelente implementación, el código es claro y fácil de mantener.

❌ Evitar comentarios como:

* Está mal.
* No sirve.
* Arréglalo.
* Hazlo otra vez.

Siempre explica el motivo de la observación y, si es posible, propone una alternativa.

---

## 📋 Checklist para aprobar un Pull Request

* [ ] El proyecto compila correctamente.
* [ ] La funcionalidad fue probada.
* [ ] No existen errores visibles.
* [ ] Sigue las convenciones del proyecto.
* [ ] Los commits tienen mensajes claros.
* [ ] No hay archivos innecesarios.
* [ ] El Pull Request tiene una descripción adecuada.

---

## 🤝 Buenas prácticas para el Code Review

* Mantén una comunicación respetuosa.
* Evalúa el código, no a la persona.
* Justifica tus observaciones.
* Reconoce las buenas implementaciones.
* Realiza revisiones oportunas para no retrasar al equipo.

---

# 📝 Convención de commits

| Tipo     | Descripción                | Ejemplo                              |
| -------- | -------------------------- | ------------------------------------ |
| feat     | Nueva funcionalidad        | `feat: agregar módulo de usuarios`   |
| fix      | Corrección de errores      | `fix: corregir validación de correo` |
| docs     | Documentación              | `docs: actualizar README`            |
| refactor | Reestructuración de código | `refactor: simplificar servicio`     |
| chore    | Mantenimiento              | `chore: actualizar dependencias`     |

---

# 🌱 Convención para nombres de ramas

| Tipo     | Ejemplo                 |
| -------- | ----------------------- |
| Feature  | `feature/login`         |
| Fix      | `fix/error-login`       |
| Refactor | `refactor/api-users`    |
| Docs     | `docs/readme`           |
| Chore    | `chore/update-packages` |

---

# 🚀 Flujo de trabajo recomendado

```text
1. git checkout develop

2. git pull origin develop

3. git checkout -b feature/nueva-funcionalidad

4. Desarrollar la funcionalidad

5. git add .

6. git commit -m "feat: agregar nueva funcionalidad"

7. git push -u origin feature/nueva-funcionalidad

8. Crear Pull Request

9. Code Review

10. Atender observaciones (si existen)

11. Aprobar Pull Request

12. Realizar Merge

13. Eliminar la rama
```

---

# 💡 Buenas prácticas

* ✅ Trabaja siempre en una rama nueva.
* ✅ No desarrolles directamente sobre `main`.
* ✅ Actualiza `develop` antes de comenzar una tarea.
* ✅ Realiza commits pequeños y frecuentes.
* ✅ Utiliza mensajes descriptivos.
* ✅ Revisa tu código antes de crear un Pull Request.
* ✅ Mantén los Pull Requests pequeños y enfocados en una sola funcionalidad.
* ✅ Atiende los comentarios del Code Review antes de solicitar una nueva aprobación.
* ✅ Elimina las ramas una vez integradas.

---

# ❌ Evita hacer esto

No utilices mensajes de commit como:

```text
update

cambios

prueba

asdf

123
```

No desarrolles directamente sobre:

```text
main
```

No mezcles varias funcionalidades en un mismo Pull Request.

---

# 📋 Comandos más utilizados

## Ver estado

```bash
git status
```

## Agregar cambios

```bash
git add .
```

## Crear commit

```bash
git commit -m "feat: descripción"
```

## Subir cambios

```bash
git push
```

## Descargar cambios

```bash
git pull
```

## Crear rama

```bash
git checkout -b feature/nombre
```

## Cambiar de rama

```bash
git checkout develop
```

## Ver ramas

```bash
git branch
```

## Ver historial

```bash
git log --oneline
```

## Ver diferencias

```bash
git diff
```

---

# 🎯 Resumen del flujo diario

```text
Actualizar develop
        │
        ▼
Crear una rama feature
        │
        ▼
Desarrollar
        │
        ▼
git add .
        │
        ▼
git commit
        │
        ▼
git push
        │
        ▼
Crear Pull Request
        │
        ▼
Code Review
        │
        ▼
Corregir observaciones (si aplica)
        │
        ▼
Aprobación
        │
        ▼
Merge
        │
        ▼
Eliminar la rama
```

---

# 🤝 Objetivo del equipo

Seguir este proceso permite:

* Mantener un historial de cambios ordenado.
* Reducir conflictos entre desarrolladores.
* Facilitar las revisiones de código.
* Mejorar la calidad del software.
* Favorecer el aprendizaje y la colaboración dentro del equipo.
