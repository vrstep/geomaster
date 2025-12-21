import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        username
        avatar
        stats {
          totalScore
          gamesPlayed
          gamesWon
          bestStreak
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      avatar
      stats {
        totalScore
        gamesPlayed
        gamesWon
        bestStreak
      }
    }
  }
`;

export const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom($config: RoomConfigInput!) {
    createRoom(config: $config) {
      id
      code
      status
      host {
        id
        username
      }
      config {
        isHostPlaying
        type
      }
    }
  }
`;

export const GET_ROOM_QUERY = gql`
  query GetRoom($code: String!) {
    getRoom(code: $code) {
      id
      code
      status
      currentQuestionIndex
      roundStartTime
      config {
        isHostPlaying
        type
        mode
        difficulty
        isRanked
      }
      host {
        id
        username
      }
      players {
        userId
        username
        avatar
        score
        isReady
        hasAnsweredCurrent
        currentAnswer
        streak
      }
      questions {
        questionText
        imageUrl
        options
        correctAnswer
      }
    }
  }
`;

export const JOIN_ROOM_MUTATION = gql`
  mutation JoinRoom($code: String!) {
    joinRoom(code: $code) {
      id
      code
      host {
        id
        username
      }
      players {
        userId
        username
        avatar
        isReady
      }
    }
  }
`;

export const START_GAME_MUTATION = gql`
  mutation StartGame($code: String!) {
    startGame(code: $code) {
      id
      status
      roundStartTime
    }
  }
`;

export const ROOM_UPDATED_SUBSCRIPTION = gql`
  subscription RoomUpdated($code: String!) {
    roomUpdated(code: $code) {
      id
      code
      status
      currentQuestionIndex
      roundStartTime
      config {
        isHostPlaying
        type
        mode
      }
      host {
        id
        username
      }
      players {
        userId
        username
        avatar
        score
        isReady
        hasAnsweredCurrent
        currentAnswer
        streak
      }
      questions {
        questionText
        imageUrl
        options
        correctAnswer
      }
    }
  }
`;

export const TOGGLE_READY_MUTATION = gql`
  mutation ToggleReady($code: String!) {
    toggleReady(code: $code) {
      id
      players {
        userId
        isReady
      }
    }
  }
`;

export const LEAVE_ROOM_MUTATION = gql`
  mutation LeaveRoom($code: String!) {
    leaveRoom(code: $code)
  }
`;

export const SUBMIT_ANSWER_MUTATION = gql`
  mutation SubmitAnswer($code: String!, $answerIndex: Int!) {
    submitAnswer(code: $code, answerIndex: $answerIndex) {
      id
      players {
        userId
        score
        hasAnsweredCurrent
        currentAnswer
        streak
      }
    }
  }
`;