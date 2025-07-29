# ���̾� ���� (Liar Game)

<div align="center">

![Kotlin](https://img.shields.io/badge/kotlin-%237F52FF.svg?style=for-the-badge&logo=kotlin&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

</div>

<div align="center">
  <h3>
    <a href="#������Ʈ-����">
      �ѱ���
    </a>
  </h3>
</div>

## ���� (Table of Contents)

- [�ѱ���](#������Ʈ-����)
  - [������Ʈ ����](#������Ʈ-����)
  - [�ֿ� ���](#�ֿ�-���)
  - [������Ʈ ����](#������Ʈ-����)
  - [��� ����](#���-����)
  - [��ġ �� ���� ���](#��ġ-��-����-���)
  - [���� �÷��� ���](#����-�÷���-���)
  - [���� ���� ��ȹ](#����-����-��ȹ)
- [English](#project-overview)
  - [Project Overview](#project-overview)
  - [Key Features](#key-features)
  - [Project Structure](#project-structure)
  - [Technology Stack](#technology-stack)
  - [Installation and Setup](#installation-and-setup)
  - [How to Play](#how-to-play)
  - [Future Development Plans](#future-development-plans)
- [License](#license)
- [Contributing](#contributing)

---

## ������Ʈ ����

���̾� ������ �÷��̾���� ������ ���õ� �ܾ ���� ��Ʈ�� �����ϰ�, ���� ���̾�(����������)���� ã�Ƴ��� �Ҽ� �߸� �����Դϴ�. ���̾�� �ܾ �𸣴� ���¿��� �ٸ� �÷��̾���� ��Ʈ�� ��� �ܾ �����ؾ� �մϴ�.

�� ������Ʈ�� Kotlin �鿣��� Vue 3 ����Ʈ���带 �����ϴ� ��뷹���� �����Ǿ� �ֽ��ϴ�.

## �ֿ� ���

- ����� ���� �� ���� ����
- ���� ���� �� ���� (�÷��̾� ��, �ð� ����, ���� ��)
- �ǽð� ä�� �� ��Ʈ ����
- ���̾� ��ǥ �� ���� �ý���
- ���� ���� �� ��� Ȯ��

## ������Ʈ ����

```
kotlin_liargame/
������ frontend/             # Vue 3 ����Ʈ���� ���ø����̼�
��   ������ public/           # ���� �ڻ�
��   ������ src/              # Vue �ҽ� �ڵ�
��   ��   ������ assets/       # ����Ʈ���� �ڻ� (CSS, �̹���)
��   ��   ������ components/   # Vue ������Ʈ
��   ��   ������ views/        # ������ �� ������Ʈ
��   ��   ������ stores/       # Pinia ���� ���� �����
��   ��   ������ router/       # Vue Router ����
��   ��   ������ App.vue       # ���� Vue ������Ʈ
��   ��   ������ main.js       # Vue ���ø����̼� ������
��   ������ package.json      # ����Ʈ���� ������
��   ������ vite.config.js    # Vite ����
������ src/                  # Kotlin �鿣�� �ҽ� �ڵ�
��   ������ main/             # ���� �ҽ� �ڵ�
��   ��   ������ kotlin/       # Kotlin �ڵ�
��   ��   ��   ������ org/example/kotlin_liargame/
��   ��   ��       ������ domain/   # �����κ� �ڵ� (����, ä��, ����� ��)
��   ��   ��       ������ config/   # ���ø����̼� ����
��   ��   ������ resources/    # ���ҽ� ����
��   ������ test/             # �׽�Ʈ �ڵ�
������ build.gradle.kts      # Gradle ���� ����
������ settings.gradle.kts   # Gradle ����
```

## ��� ����

### �鿣��
- Kotlin
- Spring Boot
- Spring WebSocket
- JPA/Hibernate
- H2 Database

### ����Ʈ����
- Vue 3 (Composition API)
- Vue Router
- Pinia (���� ����)
- Axios (HTTP ��û)
- Socket.io (�ǽð� ���)

## ���� �÷��� ���

1. Ȩ ȭ�鿡�� ����� �̸��� �Է��Ͽ� �α����մϴ�.
2. �� ������ ����ų� ���� ���ӿ� ������ �� �ֽ��ϴ�.
3. ���� ���� �� �÷��̾� ��, ���� �ð�, ���� ���� ������ �� �ֽ��ϴ�.
4. ���� �κ񿡼� �ٸ� �÷��̾���� ������ ������ ��ٸ��ϴ�.
5. ������ ���۵Ǹ� ������ �ܾ ǥ�õ˴ϴ� (���̾�� �ܾ �� �� �����ϴ�).
6. �� �÷��̾�� ��Ʈ�� �����ϰ�, ���� ���̾����� ��ǥ�մϴ�.
7. ���̾�� ����� �÷��̾�� ������ ��ȸ�� �ֽ��ϴ�.
8. ���̾�� �ܾ ���߷��� �õ��մϴ�.
9. ���尡 ������ ����� ǥ�õǰ� ���� ����� �����մϴ�.
10. ��� ���尡 ������ ���� ����� ǥ�õ˴ϴ�.

## ���� ���� ��ȹ

1. **�ٱ��� ����**: i18n�� ���� �ٱ��� ���� �߰�
2. **�׸� ����**: ��ũ ��� �� �׸� ���� ��� �߰�
3. **����� ������ �� ���**: ����� ������ �� ���� ��� ��� �߰�
4. **���� �����丮**: ���� ���� ��� ��ȸ ��� �߰�
5. **����� ����ȭ**: ����� ȯ�濡���� ��뼺 ����
6. **CI/CD ����������**: ����Ʈ���� �� �鿣�带 ���� CI/CD ���������� ����
7. **�׽�Ʈ ��ȭ**: ���� �׽�Ʈ �� E2E �׽�Ʈ �߰�